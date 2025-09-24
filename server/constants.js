
// 📌 Estados de orden unificados (back + mails + Step7)
export const ORDER_STATES = {
  onSite: {
    code: "onSite",
    label: "💵 Pago presencial confirmado",
  },
  confirmed: {
    code: "confirmed",
    label: "✅ Pago aprobado - orden CONFIRMADA",
  },
  rejected: {
    code: "rejected",
    label: "❌ Pago rechazado",
  },
  pending: {
    code: "pending",
    label: "⏳ Pago pendiente",
  },
  unknown: {
    code: "unknown",
    label: "📩 Estado no especificado",
  },
};

// 📧 Técnico en copia
export const TECHNICIAN_EMAIL = "pontserviciosderefrigeracion@gmail.com";