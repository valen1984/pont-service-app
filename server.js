import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { google } from "googleapis";
import { TECHNICIAN_EMAIL } from "./constants.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ===============================
// ⚡ Google Auth
// ===============================
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

const auth = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/calendar",
  ]
);

const gmail = google.gmail({ version: "v1", auth });
const calendar = google.calendar({ version: "v3", auth });

// ===============================
// ⚡ MercadoPago
// ===============================
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// ===============================
// Función para enviar email
// ===============================
async function sendEmail({ to, subject, body }) {
  const encodedMessage = Buffer.from(
    `To: ${to}\r\nSubject: ${subject}\r\n\r\n${body}`
  ).toString("base64");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage,
    },
  });

  console.log(`📧 Correo enviado a ${to}`);
}

// ===============================
// Función para crear evento en Calendar
// ===============================
async function createCalendarEvent({ summary, description, start, end }) {
  const event = {
    summary,
    description,
    start: { dateTime: start, timeZone: "America/Argentina/Buenos_Aires" },
    end: { dateTime: end, timeZone: "America/Argentina/Buenos_Aires" },
  };

  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
  });

  console.log("📅 Evento creado en Calendar:", res.data.htmlLink);
  return res.data.htmlLink;
}

// ===============================
// Crear preferencia de pago
// ===============================
app.post("/create_preference", async (req, res) => {
  try {
    const { title, quantity, unit_price, formData, quote } = req.body;

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [{ title, quantity, unit_price }],
        back_urls: {
          success: `${process.env.BACKEND_URL}/success`,
          failure: `${process.env.BACKEND_URL}/failure`,
          pending: `${process.env.BACKEND_URL}/pending`,
        },
        auto_return: "approved",
        metadata: { formData, quote },
      },
    });

    console.log("✅ Preference creada:", result.id);
    res.json({ id: result.id });
  } catch (error) {
    console.error("❌ Error creando preferencia:", error);
    res.status(500).send("Error creando preferencia");
  }
});

// ===============================
// Webhook de Mercado Pago
// ===============================
app.post("/webhook", async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === "payment") {
      const paymentId = data.id;
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: paymentId });

      const status = payment.status; // approved | rejected | pending
      const metadata = payment.metadata || {};
      const formData = metadata.formData || {};
      const quote = metadata.quote || {};

      if (status === "approved") {
        console.log("✅ Pago aprobado. Enviando correos y creando evento...");

        // Enviar correo al cliente
        await sendEmail({
          to: formData.email,
          subject: "✅ Pago confirmado, turno agendado",
          body: `
Hola ${formData.fullName},

Tu pago fue aprobado y tu turno quedó confirmado ✅

Dirección: ${formData.address}, ${formData.location}
Teléfono: ${formData.phone}

Total: $${quote.total}

¡Nos vemos pronto!
Equipo PONT
          `,
        });

        // Enviar correo al técnico
        await sendEmail({
          to: TECHNICIAN_EMAIL,
          subject: `Nuevo turno confirmado - ${formData.fullName}`,
          body: `
Cliente: ${formData.fullName}
Teléfono: ${formData.phone}
Dirección: ${formData.address}, ${formData.location}

Total: $${quote.total}
Fotos: ${formData.photos?.join(", ") || "No adjuntadas"}
          `,
        });

        // Crear evento en Google Calendar (ejemplo: turno de 2hs)
        const start = new Date().toISOString();
        const end = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
        await createCalendarEvent({
          summary: `Turno - ${formData.fullName}`,
          description: `Servicio en ${formData.address}, ${formData.location}`,
          start,
          end,
        });
      }

      if (status === "rejected") {
        console.log("❌ Pago rechazado. Avisando al cliente...");

        await sendEmail({
          to: formData.email,
          subject: "❌ Pago rechazado",
          body: `
Hola ${formData.fullName},

Tu pago fue rechazado ❌
El turno no fue confirmado.

Por favor, intentá nuevamente.
Equipo PONT
          `,
        });
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error en webhook:", err);
    res.sendStatus(500);
  }
});

// ===============================
// Servidor
// ===============================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
