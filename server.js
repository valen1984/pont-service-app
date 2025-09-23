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
if (rawCreds.private_key) {
  rawCreds.private_key = rawCreds.private_key.replace(/\\n/g, "\n");
}
const auth = new google.auth.GoogleAuth({
  credentials: rawCreds,
  scopes: ["https://www.googleapis.com/auth/calendar"],
});
const calendar = google.calendar({ version: "v3", auth });
const CALENDAR_ID = process.env.CALENDAR_ID; // ID del calendario compartido

// ======================
// 📌 Crear evento en Google Calendar (ISO + TZ explícito)
// ======================
async function createCalendarEvent(formData, quote) {
  try {
    if (!formData.appointmentSlot) {
      console.warn("⚠️ No hay appointmentSlot en formData, no se crea evento");
      return;
    }

    const dateStr = formData.appointmentSlot.date; // p.ej. "2025-09-24"
    const timeStr = formData.appointmentSlot.time; // p.ej. "15:00"

    // Construimos Date con offset -03:00 para fijar la hora local AR.
    // Luego enviamos .toISOString() y además declaramos el timeZone en el request.
    const slotStart = new Date(`${dateStr}T${timeStr}:00-03:00`);
    const slotEnd   = new Date(slotStart.getTime() + 2 * 60 * 60 * 1000); // +2hs

    // Logs de depuración (te muestran exactamente lo que se mandará)
    console.log("🗓️ Creando evento para:", {
      dateStr, timeStr,
      slotStart_local: slotStart.toString(),
      slotStart_iso: slotStart.toISOString(),
      slotEnd_local: slotEnd.toString(),
      slotEnd_iso: slotEnd.toISOString()
    });

    const event = {
      summary: `Servicio: ${formData.serviceType || "Turno"} - ${formData.fullName}`,
      description: `Cliente: ${formData.fullName}\nTel: ${formData.phone}\nDirección: ${formData.address}\nServicio: ${formData.serviceType}\nTotal: $${quote?.total}`,
      start: {
        dateTime: slotStart.toISOString(),
        timeZone: "America/Argentina/Buenos_Aires",
      },
      end: {
        dateTime: slotEnd.toISOString(),
        timeZone: "America/Argentina/Buenos_Aires",
      },
    };

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: event,
    });

    console.log("✅ Evento creado en Google Calendar:", response.data.htmlLink);
    return response.data;
  } catch (err) {
    console.error("❌ Error creando evento en Calendar:", err);
    throw err;
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

        await sendConfirmationEmail({ recipient: formData.email, ...formData, quote, paymentStatus: "confirmed" });
        await sendConfirmationEmail({ recipient: TECHNICIAN_EMAIL, ...formData, quote, paymentStatus: "confirmed" });

        // 👉 Guardar evento en Google Calendar
        await createCalendarEvent(formData, quote);
      }

      if (status === "rejected") {
        console.log("❌ Pago rechazado:", paymentId);
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
// 📌 Pago presencial (sin Mercado Pago)
// ======================
app.post("/reservation/onsite", async (req, res) => {
  try {
    const { formData, quote } = req.body;

    await sendOnSiteReservationEmail({ recipient: formData.email, ...formData, quote });
    await sendOnSiteReservationEmail({ recipient: TECHNICIAN_EMAIL, ...formData, quote });

    // 👉 Guardar evento en Google Calendar
    await createCalendarEvent(formData, quote);

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
// 📌 Agenda con Google Calendar (fix: medianoche local, sin domingos)
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

    const events = eventsRes.data.items || [];

    const WORKING_DAYS = [1, 2, 3, 4, 5, 6]; // lunes (1) a sábado (6). Domingo = 0
    const START_HOUR = 9;
    const END_HOUR = 17;
    const INTERVAL = 2;

    for (let i = 1; i <= 14; i++) {
      // hoy a medianoche local
      const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const date = new Date(base);
      date.setDate(base.getDate() + i);

      const dayOfWeek = date.getDay(); // 0 = domingo
      if (!WORKING_DAYS.includes(dayOfWeek)) continue;

      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      const slots = [];
      for (let hour = START_HOUR; hour < END_HOUR; hour += INTERVAL) {
        const slotStart = new Date(`${formattedDate}T${hour.toString().padStart(2, "0")}:00:00-03:00`);
        const slotEnd = new Date(slotStart.getTime() + INTERVAL * 60 * 60 * 1000);

        const now = new Date();
        const diffMs = slotStart.getTime() - now.getTime();
        const within48h = diffMs >= 0 && diffMs < 48 * 60 * 60 * 1000;

        // Chequeo de solapamiento con eventos del Calendar
        const isBusy = events.some((ev) => {
          const evStart = ev.start?.dateTime
            ? new Date(ev.start.dateTime)
            : ev.start?.date
              ? new Date(ev.start.date)
              : null;
          const evEnd = ev.end?.dateTime
            ? new Date(ev.end.dateTime)
            : ev.end?.date
              ? new Date(ev.end.date)
              : null;
          if (!evStart || !evEnd) return false;
          return slotStart < evEnd && slotEnd > evStart;
        });

        slots.push({
          time: `${hour.toString().padStart(2, "0")}:00`,
          isAvailable: !within48h && !isBusy,
          reason: within48h ? "within48h" : isBusy ? "busy" : "free",
        });
      }

      result.push({
        day: date.toLocaleDateString("es-AR", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
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
