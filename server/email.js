import sgMail from "@sendgrid/mail";
import { TECHNICIAN_EMAIL } from "../dist/server/constants.js";


// ⚡ Configuración de API Key (desde Railway envs)
const SENDGRID_KEY = process.env.SENDGRID_API_KEY ?? "";
if (!SENDGRID_KEY) {

}
sgMail.setApiKey(SENDGRID_KEY);

/**
 * Envía un mail de confirmación usando SendGrid
 * @param {Object} params
 * @param {string} params.recipient - email del cliente
 * @param {string} [params.cc] - copia opcional
 * @param {string} params.fullName
 * @param {string} params.phone
 * @param {string} params.appointment
 * @param {string} params.address
 * @param {string} params.location
 * @param {Object} params.coords { lat, lon }
 * @param {Object} params.quote - costos de la orden
 * @param {Array} params.photos - fotos adjuntas
 * @param {{ code: string, label: string }} params.estado - objeto normalizado de mapStatus
 */
export const sendConfirmationEmail = async ({
  recipient,
  cc = TECHNICIAN_EMAIL,
  fullName,
  phone,
  appointment,
  address,
  location,
  coords,
  quote,
  photos,
  estado,
}) => {
  // 🌍 Ubicación y link a Google Maps
  const coordsText = coords
    ? `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`
    : "No disponible";

  const mapsLink = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lon}`
    : "";

  // ⚡ Armamos datos dinámicos para el template
  const dynamicTemplateData = {
    estado: estado?.label ?? "📩 Estado no especificado", // 👈 usamos label directo
    fullName: fullName ?? "No informado",
    phone: phone ?? "No informado",
    email: recipient,
    appointment: appointment ?? "No especificado",
    address: address ?? "No informado",
    location: location ?? "No informado",
    coords: coordsText,
    mapsLink,
    baseCost: quote?.baseCost ? `$${quote.baseCost}` : "-",
    travelCost:
      quote?.travelCost && !isNaN(Number(quote.travelCost))
        ? `$${quote.travelCost}`
        : quote?.travelCost ?? "-",
    subtotal: quote?.subtotal ? `$${quote.subtotal}` : "-",
    iva: quote?.iva ? `$${quote.iva}` : "-",
    total: quote?.total ? `$${quote.total}` : "-",
    photos: photos && photos.length > 0 ? photos.slice(0, 3) : [], // 👈 array limpio
  };

  const msg = {
    to: recipient,
    cc,
    from: {
      email: "pontserviciosderefrigeracion@gmail.com", // remitente validado en SendGrid
      name: "Pont Refrigeración",
    },
    templateId: process.env.SENDGRID_TEMPLATE_UNICO, // ID de template dinámico
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
