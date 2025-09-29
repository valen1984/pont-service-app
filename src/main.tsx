import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initMercadoPago } from "@mercadopago/sdk-react";

const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

if (!publicKey) {
  console.error("⚠️ Mercado Pago PUBLIC KEY no está definida. Revisá Railway (.env).");
} else {
  console.log("🔑 Mercado Pago PUBLIC KEY cargada:", publicKey);
  initMercadoPago(publicKey, { locale: "es-AR" });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

