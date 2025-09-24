// ===========================
// 🚦 Estados de Orden
// ===========================

// 👉 Estados oficiales de Mercado Pago
export const MP_STATES = {
  approved: {
    code: "approved",
    label: "✅ Pago aprobado - orden CONFIRMADA",
  },
  pending: {
    code: "pending",
    label: "⏳ Pago pendiente",
  },
  rejected: {
    code: "rejected",
    label: "❌ Pago rechazado",
  },
  cancelled: {
    code: "cancelled",
    label: "⚠️ Pago cancelado",
  },
  refunded: {
    code: "refunded",
    label: "💸 Pago reembolsado",
  },
  charged_back: {
    code: "charged_back",
    label: "⚡ Desconocido por el cliente (chargeback)",
  },
};

// 👉 Estados manuales (efectivo / fuera de MP)
export const CASH_STATES = {
  cash_home: {
    code: "cash_home",
    label: "🏠 Pago en domicilio confirmado",
  },
  cash_workshop: {
    code: "cash_workshop",
    label: "🔧 Pago en taller confirmado",
  },
  unpaid: {
    code: "unpaid",
    label: "💵 Orden generada, aún sin pagar",
  },
};

// 👉 Fallback (cuando no se reconoce el estado)
export const FALLBACK_STATE = {
  unknown: {
    code: "unknown",
    label: "📩 Estado no especificado",
  },
};

// 👉 Estados unificados
export const ORDER_STATES = {
  ...MP_STATES,
  ...CASH_STATES,
  ...FALLBACK_STATE,
};

// 📧 Técnico en copia (por defecto)
export const TECHNICIAN_EMAIL =
  "pontserviciosderefrigeracion@gmail.com";

// ===========================
// 🧪 Bloque de prueba opcional
// ===========================
// Ejecutar con: node testStatusMapper.js
// (Mejor tener este snippet en un archivo aparte para pruebas rápidas)
/*
import { mapStatus } from "./statusMapper.js";

const tests = [
  "approved", "CONFIRMADA",
  "pending", "PENDIENTE",
  "rejected", "rechazada",
  "cancelled", "cancelada",
  "refunded", "charged_back",
  "cash_home", "domicilio",
  "cash_workshop", "taller",
  "unpaid", "SIN_PAGO",
  "cualquier cosa rara"
];

for (const t of tests) {
  const result = mapStatus(t);
  console.log(`${t} -> ${result.code} | ${result.label}`);
}
*/
