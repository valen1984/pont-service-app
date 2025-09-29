import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // si tenés estilos globales

// 👉 Montamos la app en el root
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
