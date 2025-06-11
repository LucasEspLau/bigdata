import type { Metadata } from "next";

import "./globals.css";


export const metadata: Metadata = {
  title: "🚨 Alertas de Calidad de Aire",
  description: "Proyecto que detecta mediante un sensor MQ135-1 y envia alertas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">

      <body
        className={`antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
