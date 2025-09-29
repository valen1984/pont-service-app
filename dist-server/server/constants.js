// ===========================
// 🚦 Estados de Orden
// ===========================
// 👉 Estados oficiales de Mercado Pago
export const MP_STATES = {
    approved: { code: "approved", label: "✅ Pago aprobado - orden CONFIRMADA" },
    pending: { code: "pending", label: "⏳ Pago pendiente" },
    rejected: { code: "rejected", label: "❌ Pago rechazado" },
    cancelled: { code: "cancelled", label: "⚠️ Pago cancelado" },
    refunded: { code: "refunded", label: "💸 Pago reembolsado" },
    charged_back: { code: "charged_back", label: "⚡ Desconocido por el cliente (chargeback)" },
};
// 👉 Estado manual (efectivo en domicilio/taller)
export const CASH_STATES = {
    cash: { code: "cash", label: "💵 Pago en efectivo (domicilio/taller)" },
    unpaid: { code: "unpaid", label: "📝 Orden generada, aún sin pagar" },
};
// 👉 Fallback
export const FALLBACK_STATE = {
    unknown: { code: "unknown", label: "📩 Estado no especificado" },
};
// 👉 Estados unificados con tipado
export const ORDER_STATES = {
    ...MP_STATES,
    ...CASH_STATES,
    ...FALLBACK_STATE,
};
// 📧 Técnico en copia (por defecto)
export const TECHNICIAN_EMAIL = "pontserviciosderefrigeracion@gmail.com";
