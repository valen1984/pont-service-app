import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { google } from "googleapis";
import { TECHNICIAN_EMAIL } from "./constants.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ==========================
// ⚡ Config Mercado Pago
// ==========================
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// ==========================
// ⚡ Config Gmail API
// ==========================
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
  scopes: ["https://www.googleapis.com/auth/gmail.send"],
});

const gmail = google.gmail({ version: "v1", auth });

// ==========================
// 📌 Función sendEmail
// ==========================
async function sendEmail({ to, subject, formData, quote }) {
  const photosBlock =
    formData.photos && formData.photos.length > 0
      ? formData.photos
          .slice(0, 2)
          .map(
            (url) =>
              `<img src="${url}" width="250" style="margin:8px;border-radius:8px;" />`
          )
          .join("")
      : `<p style="color:#64748b;">No se adjuntaron fotos.</p>`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; color:#1e293b; line-height:1.5;">
      <h2 style="color:#0f766e;">${subject}</h2>
      <p><strong>Cliente:</strong> ${formData.fullName}</p>
      <p><strong>Teléfono:</strong> ${formData.phone}</p>
      <p><strong>Email:</strong> ${formData.email}</p>
      <p><strong>Dirección:</strong> ${formData.address}, ${formData.location}</p>
      ${
        formData.coords
          ? `<p><strong>Coordenadas:</strong> 
              <a href="https://www.google.com/maps?q=${formData.coords.lat},${formData.coords.lon}" target="_blank">
                ${formData.coords.lat.toFixed(4)}, ${formData.coords.lon.toFixed(4)}
              </a>
             </p>`
          : ""
      }
      <h3>💰 Presupuesto</h3>
      <ul>
        <li><strong>Costo base:</strong> $${quote.baseCost}</li>
        <li><strong>Traslado:</strong> ${
          quote.travelCost === "💵 Bonificado"
            ? "💵 Bonificado"
            : "$" + quote.travelCost
        }</li>
        <li><strong>Subtotal:</strong> $${quote.subtotal}</li>
        <li><strong>IVA (21%):</strong> $${quote.iva}</li>
        <li><strong>Total:</strong> $${quote.total}</li>
      </ul>

      <div style="margin-top:16px;">
        <h3>📸 Fotos</h3>
        ${photosBlock}
      </div>
    </div>
  `;

  const encodedMessage = Buffer.from(
    `To: ${to}\r\n` +
      `Subject: ${subject}\r\n` +
      `Content-Type: text/html; charset=utf-8\r\n\r\n` +
      htmlBody
  ).toString("base64");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodedMessage },
  });

  console.log(`📧 Correo enviado a ${to}`);
}

// ==========================
// 📌 Webhook Mercado Pago
// ==========================
app.post("/webhook", async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === "payment") {
      const paymentId = data.id;

      console.log("🔔 Pago recibido, consultando a Mercado Pago:", paymentId);

      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: paymentId });

      const status = payment.status; // "approved", "rejected", "pending"
      const metadata = payment.metadata || {};
      const formData = metadata.formData || {};
      const quote = metadata.quote || {};

      // 📌 Número de operación
      const operationId = `#${paymentId}`;

      if (status === "approved") {
        const subject = `✅ Pago confirmado ${operationId}`;

        // Cliente
        await sendEmail({ to: formData.email, subject, formData, quote });

        // Técnico
        await sendEmail({ to: TECHNICIAN_EMAIL, subject, formData, quote });
      }

      if (status === "rejected") {
        const subject = `❌ Pago rechazado ${operationId}`;

        // Cliente
        await sendEmail({ to: formData.email, subject, formData, quote });

        // Técnico
        await sendEmail({ to: TECHNICIAN_EMAIL, subject, formData, quote });
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error en webhook:", err);
    res.sendStatus(500);
  }
});
