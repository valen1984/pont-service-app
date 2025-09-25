import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { MercadoPagoConfig } from "mercadopago";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
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
// 📌 Agenda con Google Calendar (con logs)
// ======================
async function generateSchedule() {
    const today = new Date();
    const result = [];
    function getDateInBuenosAires(baseDate, offsetDays) {
        const tz = "America/Argentina/Buenos_Aires";
        const localStr = new Date(baseDate).toLocaleString("en-US", { timeZone: tz });
        const local = new Date(localStr);
        local.setDate(local.getDate() + offsetDays);
        return local;
    }
    try {
        const eventsRes = await calendar.events.list({
            calendarId: CALENDAR_ID,
            timeMin: today.toISOString(),
            maxResults: 50,
            singleEvents: true,
            orderBy: "startTime",
        });
        console.log("📅 Eventos traídos desde Google Calendar:", eventsRes.data.items?.length);
        console.log("Eventos:", eventsRes.data.items?.map(ev => ({
            summary: ev.summary,
            start: ev.start,
            end: ev.end,
        })));
        const events = eventsRes.data.items || [];
        const WORKING_DAYS = [1, 2, 3, 4, 5, 6];
        const START_HOUR = 9;
        const END_HOUR = 17;
        const INTERVAL = 2;
        for (let i = 1; i <= 14; i++) {
            const date = getDateInBuenosAires(today, i);
            const dayOfWeek = date.getDay();
            if (!WORKING_DAYS.includes(dayOfWeek))
                continue;
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
                    if (!evStart || !evEnd)
                        return false;
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
    }
    catch (err) {
        console.error("❌ Error al generar agenda desde Google Calendar:", err);
        throw err;
    }
    return result;
}
// ======================
// 📌 ENDPOINTS DE API
// ======================
app.get("/api/schedule", async (req, res) => {
    try {
        const schedule = await generateSchedule();
        res.json(schedule);
    }
    catch (err) {
        res.status(500).json({ error: "Error al generar agenda" });
    }
});
// 👉 acá van también tus endpoints de Mercado Pago (/create_preference, /webhook, etc.)
// 👉 y el de /reservation/onsite, /api/confirm-payment, etc.
// ======================
// 📌 Servir frontend (al final siempre)
// ======================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.get("/api/schedule", async (req, res) => {
    console.log("📩 [API] /api/schedule recibido");
    try {
        const schedule = await generateSchedule();
        console.log("✅ [API] /api/schedule respuesta:", JSON.stringify(schedule, null, 2));
        res.json(schedule);
    }
    catch (err) {
        console.error("❌ [API] Error al generar agenda:", err);
        res.status(500).json({ error: "Error al generar agenda" });
    }
});
