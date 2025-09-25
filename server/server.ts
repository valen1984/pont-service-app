import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { MercadoPagoConfig } from "mercadopago";
import { TECHNICIAN_EMAIL, ORDER_STATES } from "./constants";
import { sendConfirmationEmail } from "./email.js";
import { payCash } from "./cash";  // 👈 importa la función
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
// 🔨 helper: crear evento en Google Calendar
// ======================
async function createCalendarEvent({
  date, time, summary, description,
}: {
  date: string;  // "YYYY-MM-DD"
  time: string;  // "HH:mm"
  summary: string;
  description: string;
}) {
  try {
    // fecha y hora BA → a ISO
    const start = new Date(`${date}T${time}:00-03:00`);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // bloque de 2h

    const event = await calendar.events.insert({
      calendarId: CALENDAR_ID!,
      requestBody: {
        summary,
        description,
        start: { dateTime: start.toISOString(), timeZone: "America/Argentina/Buenos_Aires" },
        end:   { dateTime: end.toISOString(),   timeZone: "America/Argentina/Buenos_Aires" },
      },
    });

    console.log("📆 Evento creado:", event.data.id, event.data.htmlLink);
    return { id: event.data.id, htmlLink: event.data.htmlLink };
  } catch (err: any) {
    console.error("❌ Error creando evento:", err.response?.data || err.message);
    throw err;
  }
}

// ======================
// 📌 Pago presencial (domicilio / taller) — SIEMPRE cash_home
// ======================
app.post("/api/confirm-onsite", async (req, res) => {
  try {
    const { formData, quote } = req.body;

    console.log("💵 [/api/confirm-onsite] payload recibido:", {
      fullName: formData?.fullName,
      email: formData?.email,
      phone: formData?.phone,
      date: formData?.appointmentSlot?.date,
      time: formData?.appointmentSlot?.time,
      total: quote?.total,
    });

    // 1) Estado manual unificado
    const estado = ORDER_STATES.cash_home; // 💵 Pago en domicilio/taller

    // 2) Crear evento
    const date = formData?.appointmentSlot?.date;
    const time = formData?.appointmentSlot?.time;
    if (!date || !time) {
      throw new Error("Falta appointmentSlot (date/time) para crear el evento");
    }

    const { id: calendarEventId, htmlLink } = await createCalendarEvent({
      date,
      time,
      summary: `Servicio técnico: ${formData?.serviceType || "Visita"}`,
      description:
        `Cliente: ${formData?.fullName || "-"} (${formData?.phone || "-"})\n` +
        `Dirección: ${formData?.address || "-"}\n` +
        `Localidad: ${formData?.location || "-"}\n` +
        `Pago: ${estado.label}\n` +
        `Total: ${new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(quote?.total ?? 0)}`,
    });

    // 3) Enviar email
    const mailResp = await sendConfirmationEmail({
      recipient: TECHNICIAN_EMAIL,   // técnico en TO
      cc: formData?.email,           // cliente en CC
      fullName: formData?.fullName,
      phone: formData?.phone,
      appointment: `${date} ${time}`,
      address: formData?.address,
      location: formData?.location,
      coords: formData?.coords,
      quote,
      photos: formData?.photos,
      estado,                        // 👈 pasa el estado cash_home
    });

    console.log("📧 Resultado email:", mailResp);

    // 4) Respuesta unificada
    return res.json({
      success: true,
      estado,                 // { code: "cash_home", label: "..." }
      calendarEventId,
      calendarEventLink: htmlLink,
    });
  } catch (err: any) {
    console.error("❌ [/api/confirm-onsite] Error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
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


