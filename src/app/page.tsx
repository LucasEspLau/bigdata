"use client";

import { useWebSocket } from "@/hook/useWebSocket";
import { formatTimestamp } from "@/lib/util";
import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Lectura = {
  sensor_id: string;
  lectura: string | number;
  mensaje?: string;
  timestamp_id: string;
};

export default function Home() {
  const { data } = useWebSocket(
    "wss://gk7f2pine0.execute-api.us-east-1.amazonaws.com/dev/"
  );
  const [lecturas, setLecturas] = useState<Lectura[]>([]);

  useEffect(() => {
    async function fetchLecturas() {
      try {
        const res = await fetch(
          "https://66g81vr8rh.execute-api.us-east-1.amazonaws.com/dev/sensor?sensorId=TU_SENSOR_ID"
        );
        if (!res.ok) throw new Error("Error fetching sensor data");
        const json = await res.json();
        setLecturas(json);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    }
    fetchLecturas();
  }, []);

  useEffect(() => {
    if (data) {
      setLecturas((prev) => [...prev, data]);
    }
  }, [data]);

  const alertCountByDay = useMemo(() => {
    const alerts = lecturas.filter(
      (l) => l.mensaje && l.mensaje.trim() !== ""
    );
    const counts: Record<string, number> = {};
    alerts.forEach(({ timestamp_id }) => {
      const date = timestamp_id.split("T")[0];
      counts[date] = (counts[date] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [lecturas]);

  const ultimaAlerta = useMemo(() => {
    return lecturas
      .filter((l) => l.mensaje && l.mensaje.trim() !== "")
      .sort((a, b) => b.timestamp_id.localeCompare(a.timestamp_id))[0];
  }, [lecturas]);

  const ultimasAlertas = useMemo(() => {
    return lecturas
      .filter((l) => l.mensaje && l.mensaje.trim() !== "")
      .sort((a, b) => b.timestamp_id.localeCompare(a.timestamp_id))
      .slice(0, 5);
  }, [lecturas]);

return (
  <div className="p-4 max-w-6xl mx-auto font-sans text-sm">
    <h1 className="text-2xl font-semibold mb-6 text-center">
      Alertas del sensor
    </h1>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Columna Izquierda */}
      <div className="flex flex-col gap-6">
        {/* Último valor destacado */}
        <section className="bg-white shadow-md rounded-lg p-6 text-center border">
          <h2 className="text-base font-semibold mb-4 text-gray-700">
            Último Valor Registrado
          </h2>
          {ultimaAlerta ? (
            <>
              <div className="w-40 h-40 mx-auto mb-4 flex items-center justify-center rounded-full border-8 border-red-400 text-4xl font-bold text-red-600">
                {ultimaAlerta.lectura}
              </div>
              <p>
                <strong>Sensor ID:</strong> {ultimaAlerta.sensor_id}
              </p>
              <p>
                <strong>Mensaje:</strong> {ultimaAlerta.mensaje}
              </p>
              <p>
                <strong>Tiempo:</strong> {formatTimestamp(ultimaAlerta.timestamp_id)}
              </p>
            </>
          ) : (
            <p className="italic text-gray-500">No hay alerta reciente.</p>
          )}
        </section>

        {/* Gráfica de alertas por día */}
        <section>
          <h2 className="font-semibold mb-2 text-base">Conteo de alertas por día</h2>
          {alertCountByDay.length === 0 ? (
            <p className="italic text-gray-500">No hay alertas para mostrar.</p>
          ) : (
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <BarChart
                  data={alertCountByDay}
                  margin={{ top: 10, right: 15, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="count" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      {/* Columna Derecha */}
      <div className="flex flex-col gap-6">
        {/* Últimas alertas */}
        <section className="overflow-y-auto max-h-64">
          <h2 className="font-semibold mb-2 text-base">Últimas 5 alertas</h2>
          {ultimasAlertas.length === 0 ? (
            <p className="italic text-gray-500 text-xs">
              No hay alertas para mostrar.
            </p>
          ) : (
            <ul className="space-y-2 text-xs">
              {ultimasAlertas.map((item, idx) => (
                <li
                  key={idx}
                  className="p-2 rounded bg-yellow-100 border border-yellow-300"
                >
                  <p>
                    <strong>Sensor ID:</strong> {item.sensor_id}
                  </p>
                  <p>
                    <strong>Lectura:</strong> {item.lectura}
                  </p>
                  <p>
                    <strong>Mensaje:</strong> {item.mensaje}
                  </p>
                  <p>
                    <strong>Tiempo:</strong> {formatTimestamp(item.timestamp_id)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Gráfica adicional: evolución de lecturas */}
        <section>
          <h2 className="font-semibold mb-2 text-base">
            Evolución reciente de lecturas
          </h2>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart
                data={lecturas.slice(-10).map((l) => ({
                  timestamp: formatTimestamp(l.timestamp_id),
                  lectura: Number(l.lectura),
                }))}
                margin={{ top: 10, right: 15, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="lectura" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  </div>
);

}
