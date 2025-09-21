import express from "express";
import cors from "cors";
import { google } from "googleapis";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Autenticación con Google
const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  undefined,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  ["https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/calendar"]
);

const gmail = google.gmail({ version: "v1", auth });
const calendar = google.calendar({ version: "v3", auth });

// 📧 Función para enviar email
async function sendGmail(to, subject, html) {
  const encodedMessage = Buffer.from(
    `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/html; charset=utf-8\r\n\r\n${html}`
  ).toString("base64");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodedMessage },
  });
}

// 📅 Función para agendar evento
async function createCalendarEvent({ summary, description, start, end }) {
  const event = {
    summary,
    description,
    start: { dateTime: start, timeZone: "America/Argentina/Buenos_Aires" },
    end: { dateTime: end, timeZone: "America/Argentina/Buenos_Aires" },
    attendees: [{ email: process.env.GMAIL_USER }],
  };

  await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
  });
}

// ⚡ MercadoPago config
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// Webhook de MercadoPago
app.post("/webhook", async (req, res) => {
  try {
    const { type, data } = req.body;
    if (type === "payment") {
      const paymentId = data.id;
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: paymentId });

      const status = payment.status;
      const formData = payment.metadata.formData || {};
      const quote = payment.metadata.quote || {};

      if (status === "approved") {
        // ✅ Correo
        await sendGmail(
          formData.email,
          "✅ Pago confirmado - Turno agendado",
          `<h2>Confirmación de turno</h2>
           <p>Hola ${formData.fullName}, tu pago fue aprobado.</p>
           <p><b>Total:</b> ${quote.total}</p>`
        );

        // 📅 Evento en Calendar (ejemplo 1 hora)
        await createCalendarEvent({
          summary: `Servicio para ${formData.fullName}`,
          description: `Dirección: ${formData.address}, ${formData.location}`,
          start: new Date().toISOString(),
          end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        });
      }

      if (status === "rejected") {
        await sendGmail(
          formData.email,
          "❌ Pago rechazado",
          `<p>Hola ${formData.fullName}, lamentablemente tu pago fue rechazado.</p>`
        );
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error en webhook:", err);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
