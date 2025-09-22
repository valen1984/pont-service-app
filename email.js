import nodemailer from "nodemailer";

const EMAIL_USER = process.env.EMAIL_USER; // tu Gmail
const EMAIL_PASS = process.env.EMAIL_PASS; // App Password (no tu clave normal)

export const sendConfirmationEmail = async ({
  recipient,
  fullName,
  phone,
  appointment,
  address,
  location,
  coords,
  quote,
  photos,
}) => {
  // Coordenadas y link a Google Maps
  const coordsText = coords
    ? `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`
    : "No disponible";
  const mapsLink = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lon}`
    : "";

  // Bloque de fotos
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

  // Creamos transport con Gmail
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  // Plantilla HTML
  const htmlContent = `
  <div style="font-family: system-ui, sans-serif, Arial; font-size: 16px;">
    <p>Gracias <b>${fullName}</b> por aceptar el presupuesto. A continuación encontrarás los detalles de tu solicitud.  
    Este mismo correo también fue enviado al técnico asignado.</p>

    <h3>👤 Datos del Cliente</h3>
    <table style="width:100%; border-collapse: collapse; margin-bottom: 16px; font-size: 14px;">
      <tr><td><b>Nombre</b></td><td>${fullName}</td></tr>
      <tr><td><b>Email</b></td><td>${recipient}</td></tr>
      <tr><td><b>Teléfono</b></td><td>${phone || "No especificado"}</td></tr>
      <tr><td><b>Dirección</b></td><td>${address || "No especificada"}</td></tr>
      <tr><td><b>Localidad</b></td><td>${location || "No especificada"}</td></tr>
      <tr>
        <td><b>Coordenadas</b></td>
        <td>
          ${coordsText} <br/>
          <a href="${mapsLink}" target="_blank">📍 Ver en Google Maps</a>
        </td>
      </tr>
    </table>

    <h3>💰 Detalle del Presupuesto</h3>
    <table style="width:100%; border-collapse: collapse; margin-bottom: 16px; font-size: 14px;">
      <tr><td>Costo base</td><td>${quote?.baseCost ?? ""}</td></tr>
      <tr><td>Traslado</td><td>${quote?.travelCost ?? ""}</td></tr>
      <tr><td>Subtotal</td><td>${quote?.subtotal ?? ""}</td></tr>
      <tr><td>IVA (21%)</td><td>${quote?.iva ?? ""}</td></tr>
      <tr style="background-color:#f3f4f6;">
        <td style="font-weight: bold;">TOTAL</td>
        <td style="font-weight: bold; color:#0d9488;">${quote?.total ?? ""}</td>
      </tr>
    </table>

    <h3>📸 Fotos del Equipo</h3>
    <div>${photos_block}</div>

    <h3>🗓 Estado</h3>
    <p><b>${appointment}</b></p>

    <hr/>
    <p style="font-size: 12px; color: #555;">
      Este correo es una confirmación automática. <br/>
      📩 Cliente: ${recipient} <br/>
      📞 Teléfono: ${phone} <br/>
      🛠 Técnico: recibe copia de este mensaje para coordinar la visita.
    </p>
  </div>`;

  try {
    await transporter.sendMail({
      from: `"PONT" <${EMAIL_USER}>`,
      to: [recipient, process.env.TECHNICIAN_EMAIL], // 👈 cliente + técnico
      subject: "¿Su orden ha sido recibida! - PONT",
      html: htmlContent,
    });

    console.log("📧 Correo enviado a:", recipient);
  } catch (error) {
    console.error("❌ Error enviando email:", error);
    throw error;
  }
};
