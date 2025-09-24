import sgMail from "@sendgrid/mail";

// ⚡ Configuración de API Key (desde Railway envs)
const SENDGRID_KEY = process.env.SENDGRID_API_KEY ?? "";
if (!SENDGRID_KEY) {
  console.warn("⚠️ Falta SENDGRID_API_KEY en env");
}
sgMail.setApiKey(SENDGRID_KEY);

export const sendConfirmationEmail = async ({
  recipient,
  cc,
  fullName,
  phone,
  appointment,
  address,
  location,
  coords,
  quote,
  photos,
  estado, // viene de server.js como "approved" | "pending" | "rejected"
}) => {
  const coordsText = coords
    ? `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`
    : "No disponible";

  const mapsLink = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lon}`
    : "";

  // ⚡ Normalizar estado a texto con emoji
  let estadoMsg = "📩 Estado no especificado";
  if (estado === "approved") estadoMsg = "✅ CONFIRMADA";
  if (estado === "pending") estadoMsg = "⏳ PENDIENTE";
  if (estado === "rejected") estadoMsg = "❌ RECHAZADA";

  // ⚡ Armamos datos dinámicos para el template
  const dynamicTemplateData = {
    estado: estadoMsg,
    fullName: fullName ?? "No informado",
    phone: phone ?? "No informado",
    email: recipient,
    appointment: appointment ?? "No especificado",
    address: address ?? "No informado",
    location: location ?? "No informado",
    coords: coordsText,
    mapsLink,
    baseCost: quote?.baseCost ? `$${quote.baseCost}` : "-",
    travelCost: quote?.travelCost ? `$${quote.travelCost}` : "-",
    subtotal: quote?.subtotal ? `$${quote.subtotal}` : "-",
    iva: quote?.iva ? `$${quote.iva}` : "-",
    total: quote?.total ? `$${quote.total}` : "-",
    photos: photos && photos.length > 0 ? photos.slice(0, 3) : [], // 👈 array limpio
  };

  const msg = {
    to: recipient,
    cc,
    from: {
      email: "pontserviciosderefrigeracion@gmail.com", // 👈 remitente validado en SendGrid
      name: "Pont Refrigeración",
    },
    templateId: process.env.SENDGRID_TEMPLATE_UNICO, // 👈 tu template ID en Railway
    dynamicTemplateData,
  };

  try {
    await sgMail.send(msg);
    console.log(`📩 Email enviado a ${recipient} ${cc ? `+ CC ${cc}` : ""}`);
    return { success: true };
  } catch (err) {
    console.error("❌ Error enviando email:", err.response?.body || err.message);
    return { success: false, error: err.message };
  }
};
