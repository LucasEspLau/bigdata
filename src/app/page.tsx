// pages/index.tsx
"use client";

import { useEffect, useState, useMemo, ReactNode } from "react";
import { useWebSocket } from "@/hook/useWebSocket";
import { formatTimestamp } from "@/lib/util";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,            // <-- Asegúrate de importar Area
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { HiOutlineBell } from "react-icons/hi";
import { BiWifi0 } from "react-icons/bi";

type Lectura = {
  sensor_id: string;
  lectura: string | number;
  mensaje?: string;
  timestamp_id: string;
};

// 1) Fuera de Home, al principio del fichero:
function getNivel(valor: number): "Bajo" | "Alto" | "Crítico" {
  if (valor > 700) return "Crítico";
  if (valor >= 500) return "Alto";
  return "Bajo";
}

export default function Home() {
  // WebSocket y estados originales
  const { data } = useWebSocket(
    "wss://gk7f2pine0.execute-api.us-east-1.amazonaws.com/dev/"
  );
  const [lecturas, setLecturas] = useState<Lectura[]>([]);

  // Filtros
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [level, setLevel] = useState<"all" | "low" | "medium" | "high">("all");
  const [searchText, setSearchText] = useState("");
  // Fetch inicial
  useEffect(() => {
    fetch(
      "https://66g81vr8rh.execute-api.us-east-1.amazonaws.com/dev/sensor?sensorId=TU_SENSOR_ID"
    )
      .then((res) => res.json())
      .then((json) => setLecturas(json))
      .catch(console.error);
  }, []);

  // Actualizaciones por WebSocket
  useEffect(() => {
    if (data) setLecturas((prev) => [...prev, data]);
  }, [data]);

  // Lecturas filtradas
  const filteredLecturas = useMemo(() => {
    return lecturas.filter((l) => {
      const fecha = l.timestamp_id?.split("T")[0];
      if (dateFrom && fecha < dateFrom) return false;
      if (dateTo && fecha > dateTo) return false;
      const val = Number(l.lectura);
      if (level === "high" && val <= 700) return false;
      if (level === "medium" && (val < 500 || val > 700)) return false;
      if (level === "low" && val >= 500) return false;
      if (
        searchText &&
        !l.mensaje?.toLowerCase().includes(searchText.toLowerCase())
      )
        return false;
      return true;
    });
  }, [lecturas, dateFrom, dateTo, level, searchText]);

  // Exportar CSV
  function exportCSV() {
    const header = ["sensor_id", "lectura", "mensaje", "timestamp_id"];
    const rows = filteredLecturas.map((l) =>
      [l.sensor_id, l.lectura, `"${l.mensaje || ""}"`, l.timestamp_id].join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "alertas_filtradas.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Cálculos usando lecturas filtradas
  const totalAlerts = filteredLecturas.filter((l) => l.mensaje && l.mensaje.trim())
    .length;

  const alertCountByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLecturas
      .filter((l) => l.mensaje && l.mensaje.trim())
      .forEach(({ timestamp_id }) => {
        const day = timestamp_id.split("T")[0];
        counts[day] = (counts[day] || 0) + 1;
      });
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-5);
  }, [filteredLecturas]);

  const ultimaAlerta = useMemo(
    () =>
      filteredLecturas
        .filter((l) => l.mensaje && l.mensaje.trim())
        .sort((a, b) => b.timestamp_id.localeCompare(a.timestamp_id))[0],
    [filteredLecturas]
  );

  // Nivel dinámico de la última lectura
  const nivelUltima = ultimaAlerta
    ? getNivel(Number(ultimaAlerta.lectura))
    : "";


  const ultimasAlertas = useMemo(
    () =>
      filteredLecturas
        .filter((l) => l.mensaje && l.mensaje.trim())
        .sort((a, b) => b.timestamp_id.localeCompare(a.timestamp_id))
        .slice(0, 10),
    [filteredLecturas]
  );

  const normales = filteredLecturas.length - totalAlerts;
  const alertas = totalAlerts;

  const lecturasHoras = useMemo(
    () =>
      filteredLecturas.slice(-5).map((l) => ({
        hora: formatTimestamp(l.timestamp_id).split(" ")[1],
        valor: Number(l.lectura),
      })),
    [filteredLecturas]
  );

  const InfoCard = ({
    title,
    children,
  }: {
    title: string;
    children: ReactNode;
  }) => (
    <div className="relative bg-[#F7FFFF] rounded-[24px] shadow-md border border-gray-200 p-6">
      {/* ————— Badge de título ahora abarca todo el ancho interior (p-6 a p-6) ————— */}
      <div
        className="
        absolute top-3 inset-x-6            /* left/right igual al padding p-6 del card */
        bg-[#5e8ad2] text-white uppercase 
        text-lg font-semibold 
        py-2                                  /* más alto para verse «robusto» */
        rounded-full 
        text-center 
        drop-shadow
      "
      >
        {title}
      </div>
      <div className="mt-20">{children}</div> {/* mt ajustado a la nueva altura */}
    </div>
  );

  const ChartCard = ({
    title,
    children,
  }: {
    title: string;
    children: ReactNode;
  }) => (
    <div className="relative bg-[#F7FFFF] rounded-[24px] shadow-md border border-gray-200 p-6">
      <div
        className="
        absolute top-3 inset-x-6
        bg-[#5e8ad2] text-white uppercase 
        text-lg font-semibold 
        py-2 
        rounded-full 
        text-center 
        drop-shadow
      "
      >
        {title}
      </div>
      <div className="mt-20">{children}</div>
    </div>
  );


  return (
    <div className="min-h-screen bg-[#b7e3ee] p-8">
      {/* ——— Encapsulamos en 4 columnas; gap opcional ——— */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">

        {/* ——— Columna izquierda: ocupa 3 de 4 columnas ——— */}
        <div className="md:col-span-3">
          <h1
            style={{
              WebkitTextStroke: "1px #13538a",    // grosor y color del borde de las letras
              WebkitTextFillColor: "#5e8ad2",     // relleno interior del texto
            }}
            className="
    text-center
    text-5xl md:text-4xl
    font-extrabold uppercase
    tracking-widest
    drop-shadow-lg
    mb-4
  "
          >
            AIRSENTINEL: PROTEGE TU VIDA Y AMBIENTE
          </h1>




          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Desde */}
            <div className="flex flex-col">
              <label className="font-extrabold uppercase text-[#6c86e6] mb-1">Desde:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="
                  w-full px-4 py-2 bg-white 
                  border border-[#6c86e6]       /* borde normal */
                  rounded-lg 
                  text-[#6c86e6] font-bold        /* texto del mismo color y en negrita */
                  focus:ring-2 focus:ring-[#5e8ad2]   /* ring de enfoque naranja */
                  focus:border-[#5e8ad2]              /* borde de enfoque naranja */
                  transition
                "
              />
            </div>
            {/* Hasta */}
            <div className="flex flex-col">
              <label className="font-extrabold uppercase text-[#6c86e6] mb-1">Hasta:</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="
                  w-full px-4 py-2 bg-white 
                  border border-[#6c86e6]       /* borde normal */
                  rounded-lg 
                  text-[#6c86e6] font-bold        /* texto del mismo color y en negrita */
                  focus:ring-2 focus:ring-[#5e8ad2]   /* ring de enfoque naranja */
                  focus:border-[#5e8ad2]              /* borde de enfoque naranja */
                  transition
                "
              />


            </div>
            {/* Nivel */}
            <div className="flex flex-col">
              <label className="font-extrabold uppercase text-[#6c86e6] mb-1">Nivel:</label>
              <select
                value={level}
                onChange={e => setLevel(e.target.value as any)}
                className="
                  w-full px-4 py-2 bg-white 
                  border border-[#6c86e6]       /* borde normal */
                  rounded-lg 
                  text-[#6c86e6] font-bold        /* texto del mismo color y en negrita */
                  focus:ring-2 focus:ring-[#5e8ad2]   /* ring de enfoque naranja */
                  focus:border-[#5e8ad2]              /* borde de enfoque naranja */
                  transition
                "
              >
                <option value="all">Todas</option>
                <option value="high">Críticas (&gt;700)</option>
                <option value="medium">Altas (500–700)</option>
                <option value="low">Bajas (&lt;500)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ——— Columna derecha: ocupa 1 de 4 columnas ——— */}
        <div className="md:col-span-1">
          <InfoCard title="Total de alertas">
            <div className="flex-1 flex justify-center items-center space-x-4 -mt-4">
              <img src="/images/alerta2.png" alt="Campana" className="w-40 h-30" />
              <span className="text-7xl font-bold text-[#13538a]">{totalAlerts}</span>
            </div>
          </InfoCard>
        </div>

      </div>

      {/* ——— Nuevo layout combinado ——— */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">

        {/** IZQUIERDA: ocupa 3 de 4 columnas y tiene 2 filas */}

        <div className="md:col-span-3 grid grid-rows-2 gap-6">

          {/* Fila 1: “Alertas vs Lectura Normal”  +  “Última lectura” */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Alertas vs Lectura Normal */}
            <ChartCard title="Alertas vs Lectura Normal">
              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Alertas", value: alertas },
                        { name: "Lectura Normal", value: normales },
                      ]}
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      // Aquí el renderer customizado:
                      label={({ name, percent, x, y }) => (
                        <text
                          x={x}
                          y={y}
                          fill="#000"                // negro puro
                          fontSize={12}
                          textAnchor="middle"
                        >
                          {`${name} ${Math.round(percent * 100)}%`}
                        </text>
                      )}
                      labelLine={false}             // opcional: quita las líneas de conexión
                    >
                      <Cell fill="#72e2ff" />
                      <Cell fill="#9ab7e3" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>



            <InfoCard title="Última lectura">
              <div
                className="
      flex flex-col md:flex-row 
      items-center justify-center         /* << siempre centrado! */
      space-y-6 md:space-y-0 md:space-x-12 /* un poco más de separación */
      mt-8
    "
              >
                {/* --- Icono dentro de círculo --- */}
                <div className="flex-shrink-0">
                  <div className="w-40 h-40 bg-[#7CEAFF] rounded-full flex items-center justify-center">
                    <img
                      src="/images/ultima_alerta.png"
                      alt="Alerta"
                      className="w-24 h-24"
                    />
                  </div>
                </div>

                {/* --- Datos: badge, valor, texto, hora/fecha --- */}
                <div className="flex flex-col items-center space-y-4">
                  {/* 1) Badge */}
                  <span className="bg-[#FED7D7] text-[#FF3131] text-lg font-bold uppercase px-4 py-2 rounded-lg">
                    Nivel {nivelUltima}
                  </span>


                  {/* 2) Valor */}
                  <span className="text-8xl font-extrabold text-[#FF3131]">
                    {ultimaAlerta?.lectura ?? "-"}
                  </span>

                  {/* 3) Subtexto */}
                  {ultimaAlerta && (

                    <p className="italic text-base text-[#1E3A8A]">
                      <strong>Mensaje:</strong> “{ultimaAlerta.mensaje}”
                    </p>

                  )}

                  {/* 4) Hora y Fecha */}
                  {ultimaAlerta && (() => {
                    const fecha = new Date(ultimaAlerta.timestamp_id);
                    const hora = fecha
                      .toLocaleTimeString("es-PE", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                      .replace("AM", "a. m.")
                      .replace("PM", "p. m.");
                    const dia = fecha.toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    });
                    return (
                      <div className="flex space-x-6 text-sm text-[#1E3A8A]">
                        <span>
                          <strong>Hora:</strong>{" "}
                          <span className="text-black">{hora}</span>
                        </span>
                        <span>
                          <strong>Fecha:</strong>{" "}
                          <span className="text-black">{dia}</span>
                        </span>
                      </div>

                    );
                  })()}
                </div>
              </div>
            </InfoCard>




          </div>

          {/* Fila 2: “Lecturas (últimas 5 horas)” + “Cantidad de alertas (últimos 5 días)” */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Lecturas (últimas 5 horas) */}

            <ChartCard title="Lecturas (últimas 5 horas)">
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={lecturasHoras}>
                    {/* Grid sólo horizontal para no recargar */}
                    <CartesianGrid stroke="#D1E9F8" strokeDasharray="5 5" vertical={false} />

                    {/* Eje X */}
                    <XAxis
                      dataKey="hora"
                      tick={{ fill: "#13538a", fontSize: 12 }}
                      label={{
                        value: "Hora",
                        position: "insideBottom",
                        offset: -5,
                        fill: "#13538a",
                        fontSize: 14,
                      }}
                    />

                    {/* Eje Y */}
                    <YAxis
                      tick={{ fill: "#13538a", fontSize: 12 }}
                      label={{
                        value: "Valor de la lectura",
                        angle: -90,
                        position: "insideLeft",
                        dy: 45,
                        fill: "#13538a",
                        fontSize: 14,
                      }}
                    />

                    <Tooltip />

                    {/* Sombreado bajo la línea */}
                    <defs>
                      <linearGradient id="gradLecturas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#72e2ff" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#72e2ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="valor"
                      stroke="none"
                      fill="url(#gradLecturas)"
                    />

                    {/* Línea principal */}
                    <Line
                      type="monotone"
                      dataKey="valor"
                      stroke="#72e2ff"
                      strokeWidth={3}
                      dot={{ r: 4, stroke: "#72e2ff", strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: "#72e2ff" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>



            {/* Cantidad de alertas (últimos 5 días) */}
            <ChartCard title="Cantidad de alertas (últimos 5 días)">
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={alertCountByDay}>
                    {/* Grid con fondo semitransparente */}
                    <CartesianGrid
                      stroke="#D1E9F8"
                      strokeDasharray="5 5"
                      // opcional: fondo de toda el área del chart
                      fill="rgba(114,226,255,0.1)"
                    />

                    {/* Eje X: formato DD/MM/YYYY */}
                    <XAxis
                      dataKey="date"
                      tick={{
                        fill: "#13538a",
                        fontSize: 12,
                      }}
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      }
                      label={{
                        value: "Fecha",
                        position: "insideBottom",
                        offset: -5,
                        fill: "#13538a",
                        fontSize: 14,
                      }}
                    />

                    {/* Eje Y */}
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "#13538a", fontSize: 12 }}
                      label={{
                        value: "Cantidad de alertas",
                        angle: -90,
                        position: "insideLeft",
                        dy: 40,
                        fill: "#13538a",
                        fontSize: 14,
                      }}
                    />

                    <Tooltip />

                    {/* Barras con color y fondo transparente */}
                    <Bar
                      dataKey="count"
                      fill="#72e2ff"
                      radius={[6, 6, 0, 0]}
                      background={{ fill: "rgba(114,226,255,0.2)" }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

          </div>
        </div>

        {/* ——— Columna Derecha (1/4): ocupa toda la altura ——— 
        <div className="flex-1 overflow-y-auto pl-2 pr-6">*/}
        <div className="md:col-span-1">
          <InfoCard title="Últimas 10 lecturas">
            <div className="w-full overflow-y-auto max-h-250 pl-2 pr-25">
              <ul className="space-y-2 text-sm">
                {ultimasAlertas.map((l, i) => (
                  <li key={i}>
                    <p className="text-[#1E3A8A]">
                      <strong>Lectura:</strong> {l.lectura}
                    </p>
                    <p className="text-[#1E3A8A]">
                      <strong>Mensaje:</strong> “{l.mensaje}”
                    </p>
                    <p className="text-gray-500 text-xs">
                      <strong>Tiempo:</strong> {formatTimestamp(l.timestamp_id)}
                    </p>
                    {i < ultimasAlertas.length - 1 && (
                      <hr className="my-2 border-[#D1E9F8]" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </InfoCard>
        </div>
      </div>

    </div>
  );
}
