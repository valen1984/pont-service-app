import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { MercadoPagoConfig } from "mercadopago";
import { sendConfirmationEmail } from "./email.js";
import { TECHNICIAN_EMAIL, ORDER_STATES } from "./constants.js";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// ======================
// 📌 CORS (ahora abierto para evitar bloqueos)
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
        const slotStart = new Date(`${formattedDate}T${hour.toString().padStart(2, "0")}:00:00-03:00`);
        const slotEnd = new Date(slotStart.getTime() + INTERVAL * 60 * 60 * 1000);

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
    console.error("❌ Error al generar agenda desde Google Calendar:", (err as Error).message);
    throw err;
  }

  console.log("✅ Agenda generada con", result.length, "días");
  return result;
}

// ======================
// 📌 ENDPOINTS DE API
// ======================
app.get("/api/schedule", async (req, res) => {
  console.log("📩 [API] /api/schedule recibido");
  try {
    const schedule = await generateSchedule();
    console.log("✅ [API] Schedule generado con", schedule.length, "días");
    if (schedule.length > 0) {
      console.log("📝 [API] Primer día:", JSON.stringify(schedule[0], null, 2));
    }

    // 👇 acá devolvemos JSON al cliente
    res.json(schedule);
  } catch (err: any) {
    console.error("❌ [API] Error al generar agenda:", err.message);
    res.status(500).json({ error: "Error al generar agenda" });
  }
});

// ======================
// 📌 Servir frontend (React build en dist)
// ======================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendPath = path.join(__dirname, "../dist");
console.log("📂 Servir frontend desde:", frontendPath);

app.use(express.static(frontendPath));

// Catch-all: cualquier ruta que no sea /api/... devuelve React
app.get("*", (req, res) => {
  if (req.originalUrl.startsWith("/api/")) {
    console.warn("⚠️ [WARN] Ruta de API cayó en el catch-all:", req.originalUrl);
    console.warn("⚠️ Esto significa que Express no encontró un endpoint para esta ruta.");
    console.warn("⚠️ Revisar orden de endpoints o fetch mal escrito en el front.");
  } else {
    console.log("➡️ [REQ] Catch-all activado (frontend)");
    console.log("   URL solicitada:", req.originalUrl);
  }

  res.sendFile(path.join(frontendPath, "index.html"));
});
// ======================
// 🚀 Start Server
// ======================
const PORT = process.env.PORT || 3000;
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Schedule endpoint: http://localhost:${PORT}/api/schedule`);
});