// hooks/useWebSocket.ts
import { useEffect, useRef, useState } from "react";

export function useWebSocket(url: string) {
  const [data, setData] = useState<any>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log("🟢 Conectado al WebSocket");

      // Si necesitas enviar algo al conectar
      ws.current?.send(JSON.stringify({ action: "nuevoDato" }));
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("📨 Mensaje recibido:", message);
        setData(message);
      } catch (err) {
        console.error("❌ Error procesando mensaje:", err);
      }
    };

    ws.current.onerror = (err) => {
      console.error("⚠️ Error en WebSocket:", err);
    };

    ws.current.onclose = () => {
      console.log("🔴 WebSocket desconectado");
    };

    return () => {
      ws.current?.close();
    };
  }, [url]);

  return { data };
}
