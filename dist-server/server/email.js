import sgMail from "@sendgrid/mail";
// ⚡ Configuración de API Key (desde Railway envs)
const SENDGRID_KEY = process.env.SENDGRID_API_KEY ?? "";
if (!SENDGRID_KEY) {
    console.warn("⚠️ Falta SENDGRID_API_KEY en env");
}
sgMail.setApiKey(SENDGRID_KEY);
//
// 1️⃣ Con template dinámico de SendGrid
//
export const sendConfirmationEmail = async ({ recipient, cc, fullName, phone, appointment, address, location, coords, quote, photos, estado, }) => {
    const coordsText = coords
        ? `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`
        : "No disponible";
    const mapsLink = coords
        ? `https://www.google.com/maps?q=${coords.lat},${coords.lon}`
        : "";
    const dynamicTemplateData = {
        estado: estado?.label ?? "📩 Estado no especificado",
        estadoCode: estado?.code ?? "unknown",
        fullName: fullName ?? "No informado",
        phone: phone ?? "No informado",
        email: recipient,
        appointment: appointment ?? "No especificado",
        address: address ?? "No informado",
        location: location ?? "No informado",
        coords: coordsText,
        mapsLink,
        baseCost: quote?.baseCost ? `$${quote.baseCost}` : "-",
        travelCost: quote?.travelCost && !isNaN(Number(quote.travelCost))
            ? `$${quote.travelCost}`
            : quote?.travelCost ?? "-",
        subtotal: quote?.subtotal ? `$${quote.subtotal}` : "-",
        iva: quote?.iva ? `$${quote.iva}` : "-",
        total: quote?.total ? `$${quote.total}` : "-",
        photos: photos && photos.length > 0 ? photos.slice(0, 3) : [],
    };
    const msg = {
        to: recipient,
        cc,
        from: {
            email: "pontserviciosderefrigeracion@gmail.com",
            name: "Pont Refrigeración",
        },
        templateId: process.env.SENDGRID_TEMPLATE_UNICO ?? "",
        dynamicTemplateData,
    };
    try {
        await sgMail.send(msg);
        console.log(`📩 Email dinámico enviado a ${recipient} ${cc ? `+ CC ${cc}` : ""}`);
        return { success: true };
    }
    catch (err) {
        console.error("❌ Error enviando email dinámico:", err.response?.body || err.message);
        return { success: false, error: err.message };
    }
};
//
// 2️⃣ Envío de email RAW (sin template, con subject/text/html)
//
export const sendRawEmail = async ({ to, subject, text, html, }) => {
    const msg = {
        to,
        from: {
            email: "pontserviciosderefrigeracion@gmail.com",
            name: "Pont Refrigeración",
        },
        subject,
        text,
        html: html || `<p>${text}</p>`,
    };
    try {
        await sgMail.send(msg);
        console.log(`📩 Email RAW enviado a ${to}`);
        return { success: true };
    }
    catch (err) {
        console.error("❌ Error enviando email RAW:", err.response?.body || err.message);
        return { success: false, error: err.message };
    }
};
