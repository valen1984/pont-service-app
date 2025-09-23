import sgMail from "@sendgrid/mail";

// Configuración de API Key (desde Railway envs)
const SENDGRID_KEY = process.env.SENDGRID_API_KEY ?? "";
if (!SENDGRID_KEY) {
  console.warn("⚠️ Falta SENDGRID_API_KEY en env");
}
sgMail.setApiKey(SENDGRID_KEY);

export const sendConfirmationEmail = async ({
  recipient,
  fullName,
  phone,
  appointment,
  address,
  location,
  coords,
  quote,   // { baseCost, travelCost, subtotal, iva, total }
  photos,  // string[] con URLs Cloudinary (0..2)
}: {
  recipient: string;
  fullName: string;
  phone: string;
  appointment: string;
  address?: string;
  location?: string;
  coords?: { lat: number; lon: number };
  quote?: { baseCost: string; travelCost: string; subtotal: string; iva: string; total: string };
  photos?: string[];
}) => {
  const coordsText = coords
    ? `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`
    : "No disponible";

  const mapsLink = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lon}`
    : "";

  const photos_block =
    photos && photos.length > 0
      ? photos
          .slice(0, 2)
          .map(
            (url) =>
              `<img src="${url}" width="200" style="margin-right:8px;border-radius:8px;"/>`
          )
          .join("")
      : `<span style="color:#64748b;">No adjuntadas</span>`;

  // 🚀 Enviar con SendGrid
  const msg = {
    to: recipient,
    from: "pontrefrigeracion@gmail.com", // 📌 remitente validado en SendGrid
    subject: "✅ Confirmación de tu servicio",
    html: `
      <h2>Confirmación de turno</h2>
      <p><strong>Cliente:</strong> ${fullName}</p>
      <p><strong>Teléfono:</strong> ${phone || "No especificado"}</p>
      <p><strong>Dirección:</strong> ${address || "No especificada"}</p>
      <p><strong>Localidad:</strong> ${location || "No especificada"}</p>
      <p><strong>Fecha/Hora:</strong> ${appointment}</p>
      <p><strong>Coordenadas:</strong> ${coordsText} ${
      mapsLink ? `(<a href="${mapsLink}">Ver en Maps</a>)` : ""
    }</p>
      <hr/>
      <h3>Presupuesto</h3>
      <p>Base: $${quote?.baseCost ?? ""}</p>
      <p>Viaje: $${quote?.travelCost ?? ""}</p>
      <p>Subtotal: $${quote?.subtotal ?? ""}</p>
      <p>IVA: $${quote?.iva ?? ""}</p>
      <p>Total: <strong>$${quote?.total ?? ""}</strong></p>
      <hr/>
      <h3>Fotos</h3>
      ${photos_block}
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`📩 Email enviado a ${recipient}`);
    return { success: true };
  } catch (err: any) {
    console.error("❌ Error enviando email:", err.response?.body || err.message);
    return { success: false, error: err.message };
  }
};
