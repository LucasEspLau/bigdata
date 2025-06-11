// pages/index.tsx
"use client";

import { useEffect, useState, useMemo, ReactNode } from "react";
import { useWebSocket } from "@/hook/useWebSocket";
import { formatTimestamp } from "@/lib/util";
import {
  ResponsiveContainer,
  LineChart,
  Line,
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
      const fecha = l.timestamp_id.split("T")[0];
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

  //const totalAlerts = lecturas.filter((l) => l.mensaje && l.mensaje.trim()).length;

  // Cálculos usando lecturas filtradas
  const totalAlerts = filteredLecturas.filter((l) => l.mensaje && l.mensaje.trim())
    .length;


  /*const alertCountByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    lecturas
      .filter((l) => l.mensaje && l.mensaje.trim())
      .forEach(({ timestamp_id }) => {
        const day = timestamp_id.split("T")[0];
        counts[day] = (counts[day] || 0) + 1;
      });
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-5);
  }, [lecturas]);
  
  const ultimaAlerta = useMemo(
    () =>
      lecturas
        .filter((l) => l.mensaje && l.mensaje.trim())
        .sort((a, b) => b.timestamp_id.localeCompare(a.timestamp_id))[0],
    [lecturas]
  );

  const ultimasAlertas = useMemo(
    () =>
      lecturas
        .filter((l) => l.mensaje && l.mensaje.trim())
        .sort((a, b) => b.timestamp_id.localeCompare(a.timestamp_id))
        .slice(0, 5),
    [lecturas]
  );

  const normales = lecturas.length - totalAlerts;
  const alertas = totalAlerts;

  const lecturasHoras = useMemo(
    () =>
      lecturas.slice(-5).map((l) => ({
        hora: formatTimestamp(l.timestamp_id).split(" ")[1],
        valor: Number(l.lectura),
      })),
    [lecturas]
  );
  
  */

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

  const ultimasAlertas = useMemo(
    () =>
      filteredLecturas
        .filter((l) => l.mensaje && l.mensaje.trim())
        .sort((a, b) => b.timestamp_id.localeCompare(a.timestamp_id))
        .slice(0, 5),
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
    <div className="relative bg-white rounded-[24px] shadow-md border border-gray-200 p-6">
      <div className="absolute -top-3 left-6 bg-[#688AF7] text-white uppercase text-xs font-semibold py-1 px-3 rounded-full">
        {title}
      </div>
      <div className="mt-6 flex items-center">{children}</div>
    </div>
  );

  const ChartCard = ({
    title,
    children,
  }: {
    title: string;
    children: ReactNode;
  }) => (
    <div className="relative bg-white rounded-[24px] shadow-md border border-gray-200 p-6">
      <div className="absolute -top-3 left-6 bg-[#688AF7] text-white uppercase text-xs font-semibold py-1 px-3 rounded-full">
        {title}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#C2EAFA] p-8">

      <h1 className="
  text-center 
  text-4xl md:text-5xl     /* Texto más grande en pantallas medias */
  font-extrabold            /* Negrita extra */
  uppercase                 /* Todo en mayúsculas */
  tracking-wider            /* Espaciado entre letras */
  text-[#7A82EC]            /* Color lila */
  mb-8 
  drop-shadow-lg            /* Sombra suave al texto */
  max-w-4xl mx-auto         /* Límite de ancho y centrado */
">
        Dashboard Alertas de
        <span className="block text-[#5F7CED]">Calidad del Aire</span>
      </h1>

      {/* Controles de filtro */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Filtro Fecha Desde */}
        {/* Filtro Fecha Desde */}
        <div className="flex flex-col">
          <label className="
      text-left 
      text-2xl md:text-1xl 
      font-extrabold 
      uppercase 
      tracking-wider 
      text-[#7A82EC]
      drop-shadow
      mb-2
    ">
            Desde
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="
        block w-full 
        px-4 py-2 
        border border-[#4F46E5] 
        rounded-lg 
        shadow-sm 
        focus:outline-none focus:ring-2 focus:ring-[#5F7CED] focus:border-transparent 
        transition
      "
          />
        </div>

        {/* Filtro Fecha Hasta */}
        <div className="flex flex-col">
          <label className="
      text-left 
      text-2xl md:text-1xl 
      font-extrabold 
      uppercase 
      tracking-wider 
      text-[#4F46E5]
      drop-shadow
      mb-2
    ">
            Hasta
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="
        block w-full 
        px-4 py-2 
        border border-[#688AF7] 
        rounded-lg 
        shadow-sm 
        focus:outline-none focus:ring-2 focus:ring-[#5F7CED] focus:border-transparent 
        transition
      "
          />
        </div>

        {/* Filtro Nivel de alerta */}
        <div className="flex flex-col">
          <label className="
      text-left 
      text-2xl md:text-1xl 
      font-extrabold 
      uppercase 
      tracking-wider 
      text-[#4F46E5]
      drop-shadow
      mb-2
    ">
            Nivel
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as any)}
            className="
        block w-full 
        px-4 py-2 
        border border-[#688AF7] 
        rounded-lg 
        shadow-sm 
        focus:outline-none focus:ring-2 focus:ring-[#5F7CED] focus:border-transparent 
        transition
      "
          >
            <option value="all">Todas</option>
            <option value="high">Críticas (&gt;700)</option>
            <option value="medium">Altas (500–700)</option>
            <option value="low">Bajas (&lt;500)</option>
          </select>
        </div>

        {/* Filtro Buscar mensaje 
        <div className="flex flex-col col-span-1 md:col-span-2">
          <label className="
      text-left 
      text-2xl md:text-3xl 
      font-extrabold 
      uppercase 
      tracking-wider 
      text-[#7A82EC]
      drop-shadow
      mb-2
    ">
            Buscar mensaje
          </label>
          <input
            type="text"
            placeholder="p.ej. crítico"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="
        block w-full 
        px-4 py-2 
        border border-[#688AF7] 
        rounded-lg 
        shadow-sm 
        focus:outline-none focus:ring-2 focus:ring-[#5F7CED] focus:border-transparent 
        transition
      "
          />
        </div>*/}

        {/*<div>
          <label className="block text-sm font-medium text-gray-700">
            Buscar mensaje
          </label>
          <input
            type="text"
            placeholder="ej. crítico"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md"
          />
        </div>*/}
        <div>
          <button
            onClick={exportCSV}
            className="
    w-full 
    bg-gradient-to-r from-[#5F7CED] to-[#7A82EC] 
    text-white 
    font-semibold 
    py-2 
    rounded-2xl 
    shadow-lg 
    hover:from-[#688AF7] hover:to-[#5F7CED] 
    transition-colors duration-300
    flex items-center justify-center space-x-2
  "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7v10m0 0l5-5m-5 5l5 5"
              />
            </svg>
            <span>Exportar CSV</span>
          </button>

        </div>
      </div>


      {/* Primera fila */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <InfoCard title="Total de alertas">
          <div className="flex-1 flex justify-center items-center space-x-4 mt-12">
            <img
              src="/images/alerta2.png"
              alt="Alerta"
              className="w-30 h-30"
            />
            <span className="text-8xl font-bold text-[#1E3A8A]">
              {totalAlerts}
            </span>
          </div>
        </InfoCard>



        <InfoCard title="Última lectura">
          {/* Único hijo de InfoCard: este div */}
          <div className="w-full space-y-6">
            {/* 1) Fila con icono + número */}
            <div className="flex items-center justify-center space-x-4 mt-8">
              <img
                src="/images/alerta.png"
                alt="Alerta"
                className="w-30 h-30"
              />
              <span className="text-8xl font-bold text-[#EF4444]">
                {ultimaAlerta?.lectura ?? "-"}
              </span>
            </div>

            {/* 2) Mensaje y tiempo justo debajo */}
            {ultimaAlerta && (
              <div className="text-center space-y-1">
                <p className="text-sm text-[#1E3A8A]">
                  <strong>Mensaje:</strong> “{ultimaAlerta.mensaje}”
                </p>
                <p className="text-xs text-gray-500">
                  <strong>Tiempo:</strong> {formatTimestamp(ultimaAlerta.timestamp_id)}
                </p>
              </div>
            )}
          </div>
        </InfoCard>



        {/* ÚLTIMAS 5 LECTURAS */}
        <InfoCard title="Últimas 5 lecturas">
          <div className="w-full overflow-y-auto max-h-60 pl-2 pr-25">
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
                    <hr className="my-2 border-t border-[#D1E9F8]" />
                  )}
                </li>
              ))}
            </ul>
          </div>
        </InfoCard>




      </div>

      {/* Segunda fila */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ChartCard title="Lecturas (últimas 5 horas)">
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={lecturasHoras}>
                <CartesianGrid stroke="#D1E9F8" strokeDasharray="5 5" />
                <XAxis
                  dataKey="hora"
                  tick={{ fill: "#1E3A8A", fontSize: 12 }}
                  label={{
                    value: "Hora",
                    position: "insideBottom",
                    offset: -5,
                    fill: "#1E3A8A",
                    fontSize: 12,
                  }}
                />
                <YAxis
                  tick={{ fill: "#1E3A8A", fontSize: 12 }}
                  label={{
                    value: "Valor de la lectura",
                    angle: -90,
                    position: "insideLeft",
                    dy: 40,            // <— baja el texto un poco
                    fill: "#1E3A8A",
                    fontSize: 12,
                  }}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="#06B6D4"
                  strokeWidth={3}
                  dot={{ r: 4, stroke: "#06B6D4", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>



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
                  label={({ name, percent }) =>
                    `${name} ${Math.round(percent * 100)}%`
                  }
                >
                  <Cell fill="#4F46E5" />
                  <Cell fill="#06B6D4" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Cantidad de alertas (últimos 5 días)">
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={alertCountByDay}>
                <CartesianGrid stroke="#D1E9F8" strokeDasharray="5 5" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#1E3A8A", fontSize: 12 }}
                  label={{
                    value: "Fecha",
                    position: "insideBottom",
                    offset: -5,
                    fill: "#1E3A8A",
                    fontSize: 12,
                  }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#1E3A8A", fontSize: 12 }}
                  label={{
                    value: "Cantidad de alertas",
                    angle: -90,
                    position: "insideLeft",
                    dy: 20,            // ajusta si es necesario
                    fill: "#1E3A8A",
                    fontSize: 12,
                  }}
                />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#4F46E5"
                  barSize={24}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>


      </div>
    </div>
  );
}
