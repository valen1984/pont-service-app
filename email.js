import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ===== Helpers =====
const currencyAR = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n ?? 0);

const statusMeta = (paymentStatus) => {
  switch (paymentStatus) {
    case "confirmed":
      return {
        label: "Confirmado ✅",
        color: "#16a34a", // verde
        subject: "✅ Reserva confirmada - PONT",
        paragraph:
          "Tu pago fue aprobado y el servicio quedó agendado. Este mismo correo también fue enviado al técnico asignado.",
      };
    case "onSite":
      return {
        label: "Abona presencialmente 💵",
        color: "#f59e0b", // amarillo
        subject: "💵 Reserva confirmada (pago presencial) - PONT",
        paragraph:
          "Tu reserva fue confirmada. Abonarás presencialmente en el domicilio o en el taller. Este mismo correo también fue enviado al técnico asignado.",
      };
    default:
      return {
        label: "-",
        color: "#6b7280",
        subject: "Reserva - PONT",
        paragraph: "Detalle de tu reserva.",
      };
  }
};

// ===== Confirmación (confirmed / onSite) =====
export const sendConfirmationEmail = async ({
  recipient,
  fullName,
  phone,
  appointment,   // string legible (ej: "12/10/2025, 15:00 hs")
  address,
  location,
  coords,        // { lat, lon } | undefined
  quote,         // { baseCost, travelCost, subtotal, iva, total }
  photos = [],
  paymentStatus, // "confirmed" | "onSite"
  bcc = process.env.TECH_EMAIL, // opcional
}) => {
  const { label, color, subject, paragraph } = statusMeta(paymentStatus);

  const coordsText = coords
    ? `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`
    : "No disponible";
  const mapsLink = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lon}`
    : "";

  const photosBlock =
    photos.length > 0
      ? photos
          .slice(0, 2)
          .map(
            (url) =>
              `<img src="${url}" width="200" style="margin-right:8px;border-radius:8px;"/>`
          )
          .join("")
      : `<span style="color:#64748b;">No adjuntadas</span>`;

  const html = `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; background:#f8fafc; padding:20px;">
    <div style="max-width:680px; margin:0 auto; background:#ffffff; border-radius:10px; padding:20px; box-shadow:0 4px 14px rgba(0,0,0,0.08);">
      <h2 style="color:#0f172a; text-align:center; margin:0 0 8px;">Confirmación de Servicio</h2>
      <p style="color:#334155; text-align:center; margin:0 0 16px;">
        Hola <strong>${fullName || "cliente"}</strong>. ${paragraph}
      </p>

      <div style="background:#f1f5f9; border-radius:8px; padding:12px 16px; margin-bottom:16px;">
        <span style="display:inline-block; font-weight:bold; color:#1e293b; margin-right:8px;">Estado:</span>
        <span style="display:inline-block; font-weight:bold; color:${color};">${label}</span>
      </div>

      <h3 style="color:#0f172a; margin:16px 0 8px;">👤 Datos del Cliente</h3>
      <table style="width:100%; border-collapse:collapse; margin-bottom: 16px; font-size:14px;">
        <tr><td style="padding:6px 0; width:160px;"><b>Nombre</b></td><td style="padding:6px 0;">${fullName || "-"}</td></tr>
        <tr><td style="padding:6px 0;"><b>Email</b></td><td style="padding:6px 0;">${recipient}</td></tr>
        <tr><td style="padding:6px 0;"><b>Teléfono</b></td><td style="padding:6px 0;">${phone || "-"}</td></tr>
        <tr><td style="padding:6px 0;"><b>Dirección</b></td><td style="padding:6px 0;">${address || "-"}</td></tr>
        <tr><td style="padding:6px 0;"><b>Localidad</b></td><td style="padding:6px 0;">${location || "-"}</td></tr>
        <tr>
          <td style="padding:6px 0;"><b>Coordenadas</b></td>
          <td style="padding:6px 0;">${coordsText}${mapsLink ? `&nbsp;&nbsp;<a href="${mapsLink}">📍 Ver en Google Maps</a>` : ""}</td>
        </tr>
      </table>

      <h3 style="color:#0f172a; margin:16px 0 8px;">💰 Detalle del Presupuesto</h3>
      <table style="width:100%; border-collapse:collapse; margin-bottom: 16px; font-size:14px;">
        <tr><td style="padding:6px 0;">Costo base</td><td style="padding:6px 0;">${currencyAR(quote?.baseCost)}</td></tr>
        <tr><td style="padding:6px 0;">Traslado</td><td style="padding:6px 0;">${
          typeof quote?.travelCost === "number" ? currencyAR(quote?.travelCost) : (quote?.travelCost ?? "")
        }</td></tr>
        <tr><td style="padding:6px 0;">Subtotal</td><td style="padding:6px 0;">${currencyAR(quote?.subtotal)}</td></tr>
        <tr><td style="padding:6px 0;">IVA (21%)</td><td style="padding:6px 0;">${currencyAR(quote?.iva)}</td></tr>
        <tr style="background-color:#f3f4f6;"><td style="padding:6px 0;"><b>TOTAL</b></td><td style="padding:6px 0;"><b style="color:#0d9488;">${currencyAR(quote?.total)}</b></td></tr>
      </table>

      <h3 style="color:#0f172a; margin:16px 0 8px;">📸 Fotos del Equipo</h3>
      <div style="margin-bottom:16px;">${photosBlock}</div>

      <h3 style="color:#0f172a; margin:16px 0 8px;">🗓 Turno</h3>
      <p style="margin:0 0 16px; color:#334155;"><b>${appointment || "-"}</b></p>

      <div style="text-align:center; margin-top:24px;">
        <a href="${process.env.FRONTEND_URL || "#"}"
           style="display:inline-block; background:#0284c7; color:#fff; text-decoration:none; padding:12px 24px; border-radius:6px; font-weight:600;">
          Ir a la App
        </a>
      </div>

      <p style="font-size:12px; color:#64748b; text-align:center; margin-top:24px;">
        Este correo es una confirmación automática.
      </p>
    </div>
  </div>`;

  try {
    const [resp] = await sgMail.send({
      to: recipient,
      from: process.env.EMAIL_FROM,
      bcc, // opcional
      subject,
      html,
    });

    console.log("📧 Confirmación enviada →", {
      to: recipient,
      bcc,
      status: resp?.statusCode,
    });

    return { ok: true };
  } catch (err) {
    console.error("❌ Error al enviar confirmación:", err.response?.body || err.message || err);
    return { ok: false, error: err.message || String(err) };
  }
};

// ===== Rechazo de pago =====
export const sendPaymentRejectedEmail = async ({
  recipient,
  fullName,
  phone,
  quote,
  bcc = process.env.TECH_EMAIL,
}) => {
  const html = `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; background:#f8fafc; padding:20px;">
    <div style="max-width:680px; margin:0 auto; background:#ffffff; border-radius:10px; padding:20px; box-shadow:0 4px 14px rgba(0,0,0,0.08);">
      <h2 style="color:#0f172a; text-align:center; margin:0 0 8px;">Pago Rechazado</h2>
      <p style="color:#334155; text-align:center; margin:0 0 16px;">
        Hola <strong>${fullName}</strong>, lamentablemente tu pago no pudo ser procesado.
      </p>

      <div style="background:#fef2f2; border-radius:8px; padding:12px 16px; margin-bottom:16px;">
        <span style="display:inline-block; font-weight:bold; color:#991b1b;">Estado: Rechazado ❌</span>
      </div>

      <h3 style="color:#0f172a; margin:16px 0 8px;">👤 Datos del Cliente</h3>
      <table style="width:100%; border-collapse:collapse; margin-bottom: 16px; font-size:14px;">
        <tr><td style="padding:6px 0; width:160px;"><b>Nombre</b></td><td style="padding:6px 0;">${fullName || "-"}</td></tr>
        <tr><td style="padding:6px 0;"><b>Email</b></td><td style="padding:6px 0;">${recipient}</td></tr>
        <tr><td style="padding:6px 0;"><b>Teléfono</b></td><td style="padding:6px 0;">${phone || "-"}</td></tr>
      </table>

      <h3 style="color:#0f172a; margin:16px 0 8px;">💰 Detalle del Presupuesto</h3>
      <table style="width:100%; border-collapse:collapse; margin-bottom: 16px; font-size:14px;">
        <tr>
          <td style="padding:6px 0; font-weight:700;">TOTAL</td>
          <td style="padding:6px 0; color:#dc2626; font-weight:700;">${currencyAR(quote?.total)}</td>
        </tr>
      </table>

      <div style="text-align:center; margin-top:24px;">
        <a href="${process.env.FRONTEND_URL || "#"}"
           style="display:inline-block; background:#0d9488; color:#fff; text-decoration:none; padding:12px 24px; border-radius:6px; font-weight:600;">
          Reintentar Pago
        </a>
      </div>

      <p style="font-size:12px; color:#64748b; text-align:center; margin-top:24px;">
        Este correo es una notificación automática.
      </p>
    </div>
  </div>`;

  try {
    const [resp] = await sgMail.send({
      to: recipient,
      from: process.env.EMAIL_FROM,
      bcc,
      subject: "⚠️ Tu pago no fue procesado - PONT",
      html,
    });

    console.log("📧 Rechazo enviado →", {
      to: recipient,
      bcc,
      status: resp?.statusCode,
    });

    return { ok: true };
  } catch (err) {
    console.error("❌ Error al enviar rechazo:", err.response?.body || err.message || err);
    return { ok: false, error: err.message || String(err) };
  }
};

// ===== Atajo para “Abona presencialmente” =====
export const sendOnSiteReservationEmail = async (payload) => {
  return sendConfirmationEmail({
    ...payload,
    paymentStatus: "onSite",
  });
};

// ===== Pendiente de pago =====
export const sendPaymentPendingEmail = async ({
  recipient,
  fullName,
  phone,
  appointment,   // string legible
  address,
  location,
  coords,
  quote,
  photos = [],
  bcc = process.env.TECH_EMAIL,
}) => {
  const html = `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; background:#f8fafc; padding:20px;">
    <div style="max-width:680px; margin:0 auto; background:#ffffff; border-radius:10px; padding:20px; box-shadow:0 4px 14px rgba(0,0,0,0.08);">
      <h2 style="color:#0f172a; text-align:center; margin:0 0 8px;">Reserva Pendiente de Pago</h2>
      <p style="color:#334155; text-align:center; margin:0 0 16px;">
        Hola <strong>${fullName || "cliente"}</strong>. 
        Tu turno fue reservado y ya quedó ocupado en la agenda, pero el pago está 
        <strong>Pendiente de acreditación</strong>.
      </p>

      <div style="background:#fef9c3; border-radius:8px; padding:12px 16px; margin-bottom:16px;">
        <span style="display:inline-block; font-weight:bold; color:#b45309;">Estado: Pendiente de Pago ⚠️</span>
      </div>

      <h3 style="color:#0f172a; margin:16px 0 8px;">👤 Datos del Cliente</h3>
      <table style="width:100%; border-collapse:collapse; margin-bottom: 16px; font-size:14px;">
        <tr><td style="padding:6px 0; width:160px;"><b>Nombre</b></td><td style="padding:6px 0;">${fullName || "-"}</td></tr>
        <tr><td style="padding:6px 0;"><b>Email</b></td><td style="padding:6px 0;">${recipient}</td></tr>
        <tr><td style="padding:6px 0;"><b>Teléfono</b></td><td style="padding:6px 0;">${phone || "-"}</td></tr>
        <tr><td style="padding:6px 0;"><b>Dirección</b></td><td style="padding:6px 0;">${address || "-"}</td></tr>
        <tr><td style="padding:6px 0;"><b>Localidad</b></td><td style="padding:6px 0;">${location || "-"}</td></tr>
      </table>

      <h3 style="color:#0f172a; margin:16px 0 8px;">💰 Detalle del Presupuesto</h3>
      <table style="width:100%; border-collapse:collapse; margin-bottom: 16px; font-size:14px;">
        <tr><td style="padding:6px 0;">Costo base</td><td style="padding:6px 0;">${currencyAR(quote?.baseCost)}</td></tr>
        <tr><td style="padding:6px 0;">Traslado</td><td style="padding:6px 0;">${
          typeof quote?.travelCost === "number" ? currencyAR(quote?.travelCost) : (quote?.travelCost ?? "")
        }</td></tr>
        <tr><td style="padding:6px 0;">Subtotal</td><td style="padding:6px 0;">${currencyAR(quote?.subtotal)}</td></tr>
        <tr><td style="padding:6px 0;">IVA (21%)</td><td style="padding:6px 0;">${currencyAR(quote?.iva)}</td></tr>
        <tr style="background-color:#fef9c3;"><td style="padding:6px 0;"><b>TOTAL</b></td><td style="padding:6px 0;"><b style="color:#b45309;">${currencyAR(quote?.total)}</b></td></tr>
      </table>

      <h3 style="color:#0f172a; margin:16px 0 8px;">🗓 Turno</h3>
      <p style="margin:0 0 16px; color:#334155;"><b>${appointment || "-"}</b></p>

      <p style="color:#334155; margin:0 0 16px;">
        🔒 El turno ya quedó reservado. Te enviaremos un correo de confirmación apenas se acredite el pago.
      </p>

      <div style="text-align:center; margin-top:24px;">
        <a href="${process.env.FRONTEND_URL || "#"}"
           style="display:inline-block; background:#f59e0b; color:#fff; text-decoration:none; padding:12px 24px; border-radius:6px; font-weight:600;">
          Ir a la App
        </a>
      </div>

      <p style="font-size:12px; color:#64748b; text-align:center; margin-top:24px;">
        Este correo es una notificación automática.
      </p>
    </div>
  </div>`;

  try {
    const [resp] = await sgMail.send({
      to: recipient,
      from: process.env.EMAIL_FROM,
      bcc,
      subject: "⏳ Reserva pendiente de pago - PONT",
      html,
    });

    console.log("📧 Pendiente de pago enviado →", {
      to: recipient,
      bcc,
      status: resp?.statusCode,
    });

    return { ok: true };
  } catch (err) {
    console.error("❌ Error al enviar pendiente de pago:", err.response?.body || err.message || err);
    return { ok: false, error: err.message || String(err) };
  }
};
