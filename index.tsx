import React from "react";
import ReactDOM from "react-dom/client";
import App from "./src/App";
import { initMercadoPago } from "@mercadopago/sdk-react";

// ⚡ Inicializar Mercado Pago una sola vez
const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
if (publicKey) {
  initMercadoPago(publicKey, { locale: "es-AR" });
} else {
  console.error("⚠️ Mercado Pago PUBLIC KEY no definida en .env");
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  // 🚫 Sin StrictMode en dev para evitar loops del SDK de MP
  <App />
);
