import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import {
  sendConfirmationEmail,
  sendPaymentRejectedEmail,
  sendOnSiteReservationEmail,
} from "./email.js";
import { TECHNICIAN_EMAIL } from "./constants.js";

import path from "path";
import { fileURLToPath } from "url";

// 👉 Google Calendar
import { google } from "googleapis";

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ⚡ Credenciales Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// ⚡ Google Calendar Config
let rawCreds = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
if (rawCreds.private_key) {
  rawCreds.private_key = rawCreds.private_key.replace(/\\n/g, "\n");
}
const auth = new google.auth.GoogleAuth({
  credentials: rawCreds,
  scopes: ["https://www.googleapis.com/auth/calendar"], // 👈 escritura habilitada
});
const calendar = google.calendar({ version: "v3", auth });
const CALENDAR_ID = process.env.CALENDAR_ID;

// 👉 Helper para crear evento
async function createCalendarEvent({ formData, quote }) {
  if (!formData.appointmentSlot) return;

  const { date, time } = formData.appointmentSlot;
  const startDateTime = new Date(`${date}T${time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // 2hs bloqueadas

  const event = {
    summary: `Servicio: ${formData.serviceType || "Turno"} - ${formData.fullName}`,
    description: `Cliente: ${formData.fullName}\nTel: ${formData.phone}\nDirección: ${formData.address}\nServicio: ${formData.serviceType}\nTotal: $${quote?.total}`,
    start: { dateTime: startDateTime.toISOString(), timeZone: "America/Argentina/Buenos_Aires" },
    end: { dateTime: endDateTime.toISOString(), timeZone: "America/Argentina/Buenos_Aires" },
    attendees: [{ email: TECHNICIAN_EMAIL }, { email: formData.email }],
  };

  try {
    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      resource: event,
    });
    console.log("📌 Evento creado en Google Calendar:", response.data.id);
  } catch (err) {
    console.error("❌ Error creando evento en Calendar:", err);
  }
}

// ======================
// 📌 Crear preferencia
// ======================
app.post("/create_preference", async (req, res) => {
  try {
    const { title, quantity, unit_price, formData, quote } = req.body;
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [{ title, quantity, unit_price }],
        back_urls: {
          success: `${process.env.FRONTEND_URL}/?status=success`,
          failure: `${process.env.FRONTEND_URL}/?status=failure`,
          pending: `${process.env.FRONTEND_URL}/?status=pending`,
        },
        auto_return: "approved",
        metadata: { formData, quote },
      },
    });

    res.json({ id: result.id });
  } catch (error) {
    console.error("❌ Error creando preferencia:", error);
    res.status(500).send("Error creando preferencia");
  }
});

// ======================
// 📌 Webhook Mercado Pago
// ======================
app.post("/webhook", async (req, res) => {
  try {
    const { type, data } = req.body;
    if (type === "payment") {
      const paymentId = data.id;
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: paymentId });

      const status = payment.status;
      const metadata = payment.metadata || {};
      const formData = metadata.formData || {};
      const quote = metadata.quote || {};

      if (status === "approved") {
        console.log("✅ Pago aprobado:", paymentId);

        // Emails
        await sendConfirmationEmail({ recipient: formData.email, ...formData, quote, paymentStatus: "confirmed" });
        await sendConfirmationEmail({ recipient: TECHNICIAN_EMAIL, ...formData, quote, paymentStatus: "confirmed" });

        // Evento en Calendar
        await createCalendarEvent({ formData, quote });
      }

      if (status === "rejected") {
        await sendPaymentRejectedEmail({ recipient: formData.email, ...formData, quote });
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error en webhook:", err);
    res.sendStatus(500);
  }
});

// ======================
// 📌 Pago presencial
// ======================
app.post("/reservation/onsite", async (req, res) => {
  try {
    const { formData, quote } = req.body;

    // Emails
    await sendOnSiteReservationEmail({ recipient: formData.email, ...formData, quote });
    await sendOnSiteReservationEmail({ recipient: TECHNICIAN_EMAIL, ...formData, quote });

    // Evento en Calendar
    await createCalendarEvent({ formData, quote });

    res.json({ ok: true, message: "📧 Correo + evento creados" });
  } catch (err) {
    console.error("❌ Error en /reservation/onsite:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ======================
// 📌 Agenda con Google Calendar (igual que ahora)
// ======================
async function generateSchedule() {
  const today = new Date();
  const result = [];

  const eventsRes = await calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin: today.toISOString(),
    maxResults: 50,
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = eventsRes.data.items || [];
  const busySlotsFromCalendar = [];

  for (const ev of events) {
    const start = ev.start?.dateTime ? new Date(ev.start.dateTime) : new Date(ev.start?.date);
    const end = ev.end?.dateTime ? new Date(ev.end.dateTime) : new Date(ev.end?.date);
    if (!start || !end) continue;

    const yyyy = start.getFullYear();
    const mm = String(start.getMonth() + 1).padStart(2, "0");
    const dd = String(start.getDate()).padStart(2, "0");
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    for (let hour = 9; hour < 17; hour += 2) {
      const slotDateTime = new Date(`${formattedDate}T${hour.toString().padStart(2, "0")}:00`);
      if (slotDateTime >= start && slotDateTime < end) {
        busySlotsFromCalendar.push({ date: formattedDate, time: slotDateTime.toTimeString().slice(0, 5) });
      }
    }
  }

  const WORKING_DAYS = [1, 2, 3, 4, 5, 6];
  for (let i = 1; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dayOfWeek = date.getDay();
    if (!WORKING_DAYS.includes(dayOfWeek)) continue;

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    const slots = [];
    for (let hour = 9; hour < 17; hour += 2) {
      const slotTime = `${hour.toString().padStart(2, "0")}:00`;
      const slotDateTime = new Date(`${formattedDate}T${slotTime}:00`);
      const now = new Date();
      const diffMs = slotDateTime.getTime() - now.getTime();

      const within48h = diffMs >= 0 && diffMs < 48 * 60 * 60 * 1000;
      const isBusy = busySlotsFromCalendar.some((s) => s.date === formattedDate && s.time === slotTime);

      slots.push({
        time: slotTime,
        isAvailable: !within48h && !isBusy,
        reason: within48h ? "within48h" : isBusy ? "busy" : "free",
      });
    }

    result.push({
      day: date.toLocaleDateString("es-AR", { weekday: "short" }),
      date: formattedDate,
      slots,
    });
  }

  return result;
}

app.get("/api/schedule", async (req, res) => {
  try {
    const schedule = await generateSchedule();
    res.json(schedule);
  } catch (err) {
    console.error("❌ Error al generar agenda:", err);
    res.status(500).json({ error: "Error al generar agenda" });
  }
});

// ======================
// 📌 Servir frontend
// ======================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
