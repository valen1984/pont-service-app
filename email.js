import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER, // 👉 tu Gmail
    pass: process.env.GMAIL_APP_PASSWORD, // 👉 tu App Password generado
  },
});

// ===============================
// 📩 Correo de confirmación (aprobado)
// ===============================
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
  const coordsText = coords
    ? `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`
    : "No disponible";
  const mapsLink = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lon}`
    : "";

  const photosBlock =
    photos && photos.length > 0
      ? photos
          .slice(0, 2)
          .map(
            (url) =>
              `<img src="${url}" width="200" style="margin-right:8px;border-radius:8px;"/>`
          )
          .join("")
      : `<span style="color:#64748b;">No adjuntadas</span>`;

  const html = `
  <div style="font-family: system-ui, sans-serif, Arial; font-size: 16px;">
    <p>Gracias <b>${fullName}</b> por aceptar el presupuesto. Este mismo correo también fue enviado al técnico asignado.</p>

    <h3>👤 Datos del Cliente</h3>
    <table style="width:100%; border-collapse: collapse; margin-bottom: 16px; font-size: 14px;">
      <tr><td><b>Nombre</b></td><td>${fullName}</td></tr>
      <tr><td><b>Email</b></td><td>${recipient}</td></tr>
      <tr><td><b>Teléfono</b></td><td>${phone}</td></tr>
      <tr><td><b>Dirección</b></td><td>${address}</td></tr>
      <tr><td><b>Localidad</b></td><td>${location}</td></tr>
      <tr><td><b>Coordenadas</b></td><td>${coordsText}<br/><a href="${mapsLink}">📍 Ver en Google Maps</a></td></tr>
    </table>

    <h3>💰 Detalle del Presupuesto</h3>
    <table style="width:100%; border-collapse: collapse; font-size: 14px;">
      <tr><td>Costo base</td><td>${quote?.baseCost ?? ""}</td></tr>
      <tr><td>Traslado</td><td>${quote?.travelCost ?? ""}</td></tr>
      <tr><td>Subtotal</td><td>${quote?.subtotal ?? ""}</td></tr>
      <tr><td>IVA (21%)</td><td>${quote?.iva ?? ""}</td></tr>
      <tr style="background-color:#f3f4f6;"><td><b>TOTAL</b></td><td><b style="color:#0d9488;">${quote?.total ?? ""}</b></td></tr>
    </table>

    <h3>📸 Fotos del Equipo</h3>
    <div>${photosBlock}</div>

    <h3>🗓 Estado</h3>
    <p><b>${appointment}</b></p>

    <hr/>
    <p style="font-size: 12px; color: #555;">Este correo es una confirmación automática.</p>
  </div>
  `;

  await transporter.sendMail({
    from: `"PONT Servicios" <${process.env.GMAIL_USER}>`,
    to: recipient,
    subject: "¿Su orden ha sido recibida! - PONT",
    html,
  });

  console.log("📧 Correo de confirmación enviado a:", recipient);
};

// ===============================
// 📩 Correo de rechazo de pago
// ===============================
export const sendPaymentRejectedEmail = async ({
  recipient,
  fullName,
  phone,
  quote,
}) => {
  const html = `
  <div style="font-family: system-ui, sans-serif, Arial; font-size: 16px;">
    <p>Hola <b>${fullName}</b>, lamentablemente tu pago no pudo ser procesado.  
    A continuación te dejamos los detalles de tu solicitud para que puedas reintentar el pago.</p>

    <h3>👤 Datos del Cliente</h3>
    <table style="width:100%; border-collapse: collapse; margin-bottom: 16px; font-size: 14px;">
      <tr><td><b>Nombre</b></td><td>${fullName}</td></tr>
      <tr><td><b>Email</b></td><td>${recipient}</td></tr>
      <tr><td><b>Teléfono</b></td><td>${phone}</td></tr>
    </table>

    <h3>💰 Detalle del Presupuesto</h3>
    <table style="width:100%; border-collapse: collapse; margin-bottom: 16px; font-size: 14px;">
      <tr><td style="font-weight: bold;">TOTAL</td><td style="color:#dc2626; font-weight: bold;">${quote?.total ?? ""}</td></tr>
    </table>

    <h3>🛑 Estado</h3>
    <p style="color:#dc2626;"><b>❌ Pago rechazado, tu turno no fue confirmado.</b></p>

    <div style="margin-top:20px;">
      <a href="${process.env.FRONTEND_URL}" target="_blank" 
         style="display:inline-block; padding:10px 20px; background:#0d9488; color:#fff; 
                text-decoration:none; border-radius:6px; font-weight:bold;">
        Reintentar Pago
      </a>
    </div>

    <hr/>
    <p style="font-size: 12px; color: #555;">Este correo es una notificación automática.</p>
  </div>
  `;

  await transporter.sendMail({
    from: `"PONT Servicios" <${process.env.GMAIL_USER}>`,
    to: recipient,
    subject: "⚠️ Tu pago no fue procesado - PONT",
    html,
  });

  console.log("📧 Correo de rechazo enviado a:", recipient);
};
