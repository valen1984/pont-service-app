import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { MercadoPagoConfig } from "mercadopago";
import { TECHNICIAN_EMAIL, ORDER_STATES } from "./constants.js";
import { sendConfirmationEmail } from "./email.js";
import { payCash } from "./cash.ts";  // 👈 importa la función
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));


// ======================
// 📌 CORS (abierto para evitar bloqueos)
// ======================
app.use(cors({ origin: "*" }));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 🌍 Debug envs importantes
console.log("🌍 ENV CALENDAR_ID:", process.env.CALENDAR_ID);
console.log("🌍 ENV GOOGLE_PROJECT_ID:", process.env.GOOGLE_PROJECT_ID);
console.log("🌍 ENV GOOGLE_CLIENT_EMAIL:", process.env.GOOGLE_CLIENT_EMAIL ? "OK" : "MISSING");
console.log("🌍 ENV GOOGLE_PRIVATE_KEY:", process.env.GOOGLE_PRIVATE_KEY ? "OK" : "MISSING");

// ⚡ Middleware para log de todas las requests
app.use((req, res, next) => {
  const isApi = req.originalUrl.startsWith("/api/");
  console.log("➡️ [REQ]", isApi ? "[API]" : "[FRONT]");
  console.log("   URL:", req.originalUrl);
  console.log("   Method:", req.method);
  console.log("   Host:", req.headers.host);
  if (req.headers.origin) {
    console.log("   Origin:", req.headers.origin);
  }
  next();
});

// ⚡ Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",
});

// ⚡ Google Calendar
let rawCreds = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON || "{}");
if (rawCreds.private_key) {
  rawCreds.private_key = rawCreds.private_key.replace(/\\n/g, "\n");
}
const auth = new google.auth.GoogleAuth({
  credentials: rawCreds,
  scopes: ["https://www.googleapis.com/auth/calendar"],
});
const calendar = google.calendar({ version: "v3", auth });
const CALENDAR_ID = process.env.CALENDAR_ID;

// ======================
// 📌 Generador de agenda con Google Calendar
// ======================
async function generateSchedule() {
  const today = new Date();
  const result: any[] = [];

  console.log("🕒 Generating schedule desde:", today.toISOString());

  function getDateInBuenosAires(baseDate: Date, offsetDays: number) {
    const tz = "America/Argentina/Buenos_Aires";
    const localStr = new Date(baseDate).toLocaleString("en-US", { timeZone: tz });
    const local = new Date(localStr);
    local.setDate(local.getDate() + offsetDays);
    return local;
  }

  try {
    const eventsRes = await calendar.events.list({
      calendarId: CALENDAR_ID!,
      timeMin: today.toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = eventsRes.data.items || [];
    console.log("📅 Eventos de Google Calendar recibidos:", events.length);

    const WORKING_DAYS = [1, 2, 3, 4, 5, 6]; // lunes a sábado
    const START_HOUR = 9;
    const END_HOUR = 17;
    const INTERVAL = 2;

    for (let i = 1; i <= 14; i++) {
      const date = getDateInBuenosAires(today, i);
      const dayOfWeek = date.getDay();

      if (!WORKING_DAYS.includes(dayOfWeek)) continue;

      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      const slots = [];
      for (let hour = START_HOUR; hour < END_HOUR; hour += INTERVAL) {
        const slotStart = new Date(
          `${formattedDate}T${hour.toString().padStart(2, "0")}:00:00-03:00`
        );
        const slotEnd = new Date(
          slotStart.getTime() + INTERVAL * 60 * 60 * 1000
        );

        const now = new Date();
        const diffMs = slotStart.getTime() - now.getTime();
        const within48h = diffMs >= 0 && diffMs < 48 * 60 * 60 * 1000;

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
    console.error(
      "❌ Error al generar agenda desde Google Calendar:",
      (err as Error).message
    );
    throw err;
  }

  console.log("✅ Agenda generada con", result.length, "días");
  return result;
}

// ======================
// 📌 ENDPOINTS DE API
// ======================
app.get("/api/schedule", async (req, res) => {
  try {
    const schedule = await generateSchedule();
    res.json(schedule);
  } catch (err: any) {
    res.status(500).json({ error: "Error al generar agenda" });
  }
});

// ======================
// 📌 Servir frontend (React build en dist)
// ======================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../dist")));

// ⚠️ Catch-all SOLO si no es /api/*
app.get(/^\/(?!api).*/, (req, res) => {
  console.log(`➡️ [REQ] Frontend route: ${req.originalUrl}`);
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

// ======================
// 🚀 Start Server
// ======================
const PORT = process.env.PORT || 3000;
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Schedule endpoint: http://localhost:${PORT}/api/schedule`);
});

// ======================
// 📌 Pago presencial (domicilio / taller)
// ======================
app.post("/api/confirm-onsite", async (req, res) => {
  try {
    const { formData, quote } = req.body;

    console.log("💵 Pago presencial recibido:", formData);

    await sendConfirmationEmail({
      recipient: TECHNICIAN_EMAIL, // 👨‍🔧 al técnico
      cc: formData.email,          // 📩 copia al cliente
      fullName: formData.fullName,
      phone: formData.phone,
      appointment: `${formData.appointmentSlot?.date} ${formData.appointmentSlot?.time}`,
      address: formData.address,
      location: formData.location,
      coords: formData.coords,
      quote,
      photos: formData.photos,
      estado: ORDER_STATES.cash_home, // 👈 Estado unificado en constants.ts
    });

    res.json({ success: true, estado: ORDER_STATES.cash_home });
  } catch (err: any) {
    console.error("❌ Error en confirm-onsite:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📩 Confirmación de pago online (MercadoPago)
app.post("/api/confirm-payment", async (req, res) => {
  try {
    const { formData, quote, paymentId } = req.body;

    console.log("💳 Confirmación de pago recibida:", { paymentId, formData });

    // 👇 Pedimos el estado real a la API de MercadoPago
    const payment = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
    }).then((r) => r.json());

    console.log("📡 Estado MercadoPago:", payment.status);

    await sendConfirmationEmail({
      recipient: TECHNICIAN_EMAIL,
      cc: formData.email,
      fullName: formData.fullName,
      phone: formData.phone,
      appointment: `${formData.appointmentSlot?.date} ${formData.appointmentSlot?.time}`,
      address: formData.address,
      location: formData.location,
      coords: formData.coords,
      quote,
      photos: formData.photos,
      estado: { code: payment.status, label: `Pago ${payment.status}` }, // 👈 Estado dinámico
    });

    res.json({ success: true, estado: payment.status });
  } catch (err: any) {
    console.error("❌ Error en confirm-payment:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});
