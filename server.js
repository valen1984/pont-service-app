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

// ⚡ Credenciales de Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// ⚡ Google Calendar Config
let rawCreds = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);

// 👉 FIX: transformar los "\n" en saltos reales
if (rawCreds.private_key) {
  rawCreds.private_key = rawCreds.private_key.replace(/\\n/g, "\n");
}

const auth = new google.auth.GoogleAuth({
  credentials: rawCreds,
  scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
});

const calendar = google.calendar({ version: "v3", auth });
const CALENDAR_ID = process.env.CALENDAR_ID; // 👉 ID del calendario compartido

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

    console.log("✅ Preference creada:", result.id);
    res.json({ id: result.id });
  } catch (error) {
    console.error("❌ Error creando preferencia:", error);
    res.status(500).send("Error creando preferencia");
  }
});

// ======================
// 📌 Webhook de Mercado Pago
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

        // 👉 Email a cliente
        await sendConfirmationEmail({
          recipient: formData.email,
          fullName: formData.fullName,
          phone: formData.phone,
          appointment: "✅ Pago confirmado, turno agendado",
          address: formData.address,
          location: formData.location,
          coords: formData.coords,
          quote,
          photos: formData.photos,
          paymentStatus: "confirmed",
        });

        // 👉 Email al técnico
        await sendConfirmationEmail({
          recipient: TECHNICIAN_EMAIL,
          fullName: formData.fullName,
          phone: formData.phone,
          appointment: "✅ Pago confirmado, turno agendado",
          address: formData.address,
          location: formData.location,
          coords: formData.coords,
          quote,
          photos: formData.photos,
          paymentStatus: "confirmed",
        });
      }

      if (status === "rejected") {
        console.log("❌ Pago rechazado:", paymentId);

        await sendPaymentRejectedEmail({
          recipient: formData.email,
          fullName: formData.fullName,
          phone: formData.phone,
          quote,
        });
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error en webhook:", err);
    res.sendStatus(500);
  }
});

// ======================
// 📌 Pago presencial (sin Mercado Pago)
// ======================
app.post("/reservation/onsite", async (req, res) => {
  try {
    const { formData, quote } = req.body;

    const appointment = formData.appointmentSlot
      ? `${formData.appointmentSlot.date}, ${formData.appointmentSlot.time} hs`
      : "-";

    // Email al cliente
    await sendOnSiteReservationEmail({
      recipient: formData.email,
      fullName: formData.fullName,
      phone: formData.phone,
      appointment,
      address: formData.address,
      location: formData.location,
      coords: formData.coords,
      photos: formData.photos,
      quote,
    });

    // Email al técnico
    await sendOnSiteReservationEmail({
      recipient: TECHNICIAN_EMAIL,
      fullName: formData.fullName,
      phone: formData.phone,
      appointment,
      address: formData.address,
      location: formData.location,
      coords: formData.coords,
      photos: formData.photos,
      quote,
    });

    res.json({ ok: true, message: "📧 Correo de pago presencial enviado" });
  } catch (err) {
    console.error("❌ Error en /reservation/onsite:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ======================
// 📌 Consultar estado de un pago (para Step7)
// ======================
app.get("/api/payment-status/:paymentId", async (req, res) => {
  try {
    const { paymentId } = req.params;
    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: paymentId });

    const status = payment.status;
    const metadata = payment.metadata || {};
    const formData = metadata.formData || {};
    const quote = metadata.quote || {};

    res.json({ status, formData, quote });
  } catch (err) {
    console.error("❌ Error consultando pago:", err.message || err);
    res.status(404).json({ status: "error", message: "Pago no encontrado" });
  }
});

// ======================
// 📌 Agenda con Google Calendar
// ======================
async function generateSchedule() {
  const today = new Date();
  const result = [];

  try {
    const eventsRes = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: today.toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime",
    });

    console.log(
      "📅 Respuesta cruda de Google Calendar:",
      JSON.stringify(eventsRes.data, null, 2)
    );

    const events = eventsRes.data.items || [];
    const busySlotsFromCalendar = [];

    // ✅ Bloqueo de todos los slots dentro de los rangos de los eventos
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
          busySlotsFromCalendar.push({
            date: formattedDate,
            time: slotDateTime.toTimeString().slice(0, 5),
          });
        }
      }
    }

    const WORKING_DAYS = [1, 2, 3, 4, 5, 6]; // lunes a sábado
    const START_HOUR = 9;
    const END_HOUR = 17;
    const INTERVAL = 2;

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
      for (let hour = START_HOUR; hour < END_HOUR; hour += INTERVAL) {
        const slotTime = `${hour.toString().padStart(2, "0")}:00`;

        const slotDateTime = new Date(`${formattedDate}T${slotTime}:00`);
        const now = new Date();
        const diffMs = slotDateTime.getTime() - now.getTime();

        const within48h = diffMs >= 0 && diffMs < 48 * 60 * 60 * 1000;
        const isBusy = busySlotsFromCalendar.some(
          (s) => s.date === formattedDate && s.time === slotTime
        );

        slots.push({
          time: slotTime,
          isAvailable: !within48h && !isBusy,
          reason: within48h ? "within48h" : isBusy ? "busy" : "free",
        });
      }

      const dayFormatted = date.toLocaleDateString("es-AR", {
        weekday: "short",
      });
      const dateFormatted = date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      result.push({
        day: `${dayFormatted} ${dateFormatted}`,
        date: formattedDate,
        slots,
      });
    }
  } catch (err) {
    console.error("❌ Error al generar agenda desde Google Calendar:", err);
    throw err;
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
