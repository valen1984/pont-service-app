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
  estado,
}: {
  recipient: string;
  cc?: string; // 👈 copia opcional (para tu amigo)
  fullName?: string;
  phone?: string;
  appointment?: string;
  address?: string;
  location?: string;
  coords?: { lat: number; lon: number };
  quote?: { baseCost: string; travelCost: string; subtotal: string; iva: string; total: string };
  photos?: string[];
  estado?: string;
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

  // 🎨 Color dinámico para el estado
  let estadoColor = "#555";
  if (estado?.includes("aprobado") || estado?.includes("CONFIRMADA")) {
    estadoColor = "#16a34a"; // verde
  } else if (estado?.includes("pendiente")) {
    estadoColor = "#ca8a04"; // amarillo
  } else if (estado?.includes("rechazado")) {
    estadoColor = "#dc2626"; // rojo
  }

  // 🚀 Enviar con SendGrid
  const msg = {
    to: recipient,
    cc,
    from: {
      email: "pontserviciosderefrigeracion@gmail.com", // 📌 remitente validado en SendGrid
      name: "Pont Refrigeración",
    },
    subject: estado ? estado : "📩 Actualización de tu servicio",
    html: `
      <h2 style="font-family:sans-serif;">Estado de tu orden</h2>
      <p style="color:${estadoColor};font-weight:bold;">
        ${estado ?? "📩 Estado no especificado"}
      </p>

      <h3>👤 Cliente</h3>
      <p><b>Nombre:</b> ${fullName ?? "No informado"}</p>
      <p><b>Teléfono:</b> ${phone ?? "No informado"}</p>
      <p><b>Email:</b> ${recipient}</p>
      <p><b>Dirección:</b> ${address ?? "No informado"}</p>
      <p><b>Localidad:</b> ${location ?? "No informado"}</p>

      <h3>📍 Ubicación</h3>
      <p>${coordsText} ${
      mapsLink ? `(<a href="${mapsLink}">Ver en Maps</a>)` : ""
    }</p>

      <h3>💰 Presupuesto</h3>
      <p>Base: $${quote?.baseCost ?? "-"}</p>
      <p>Traslado: $${quote?.travelCost ?? "-"}</p>
      <p>Subtotal: $${quote?.subtotal ?? "-"}</p>
      <p>IVA: $${quote?.iva ?? "-"}</p>
      <p><b>Total: $${quote?.total ?? "-"}</b></p>

      <h3>📸 Fotos</h3>
      <div>${photos_block}</div>

      <hr/>
      <p style="font-size:12px;color:#555;">
        Este correo es automático.<br/>
        Cliente: ${recipient}<br/>
        Copia: ${cc ?? "No enviada"}
      </p>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`📩 Email enviado a ${recipient} ${cc ? `+ CC ${cc}` : ""}`);
    return { success: true };
  } catch (err: any) {
    console.error("❌ Error enviando email:", err.response?.body || err.message);
    return { success: false, error: err.message };
  }
};
