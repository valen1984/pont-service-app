import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// 🟦 Debug: verificar que la key llega desde Railway
console.log("🔑 VITE_MERCADOPAGO_PUBLIC_KEY:", import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY);

if (!import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY) {
  console.error("⚠️ Mercado Pago PUBLIC KEY no definida en .env (frontend)");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
