// main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initMercadoPago } from "@mercadopago/sdk-react";

// ⚡ Inicializar MercadoPago con tu PUBLIC_KEY
initMercadoPago(import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY!, {
  locale: "es-AR", // 👈 ajustá el locale si querés
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
