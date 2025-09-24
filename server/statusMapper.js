import { ORDER_STATES } from "../dist/server/constants.js";

/**
 * Normaliza cualquier estado (de Mercado Pago, manual o legacy)
 * y lo convierte en un objeto { code, label } de ORDER_STATES
 */
export function mapStatus(input) {
  if (!input) return ORDER_STATES.unknown;

  // 🔎 Convertimos a string y lo pasamos a minúsculas
  const status = String(input).toLowerCase();

  // 🟢 Mercado Pago
  if (["approved", "confirmada", "confirmed"].includes(status)) {
    return ORDER_STATES.approved;
  }
  if (["pending", "pendiente"].includes(status)) {
    return ORDER_STATES.pending;
  }
  if (["rejected", "rechazada"].includes(status)) {
    return ORDER_STATES.rejected;
  }
  if (["cancelled", "cancelada"].includes(status)) {
    return ORDER_STATES.cancelled;
  }
  if (status === "refunded") {
    return ORDER_STATES.refunded;
  }
  if (status === "charged_back") {
    return ORDER_STATES.charged_back;
  }

  // 💵 Manuales
  if (["cash_home", "home", "domicilio", "onsite"].includes(status)) {
    return ORDER_STATES.cash_home;
  }
  if (["cash_workshop", "workshop", "taller"].includes(status)) {
    return ORDER_STATES.cash_workshop;
  }
  if (["unpaid", "no_pagado", "sin_pago"].includes(status)) {
    return ORDER_STATES.unpaid;
  }

  // 📩 Fallback
  return ORDER_STATES.unknown;
}
