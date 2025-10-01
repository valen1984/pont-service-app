import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { TECHNICIAN_EMAIL, ORDER_STATES } from "./constants.js";
import { sendConfirmationEmail } from "./email.js";
import { payCash } from "./cash.js";
import path from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import dotenv from "dotenv";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { MP_STATES } from "./constants.js";
import { CASH_STATES } from "./constants.js";


dotenv.config();
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 🌍 Debug envs importantes
console.log("🌍 ENV CALENDAR_ID:", process.env.CALENDAR_ID);
console.log("🌍 ENV GOOGLE_PROJECT_ID:", process.env.GOOGLE_PROJECT_ID);
console.log("🌍 ENV GOOGLE_CLIENT_EMAIL:", process.env.GOOGLE_CLIENT_EMAIL ? "OK" : "MISSING");
console.log("🌍 ENV GOOGLE_PRIVATE_KEY:", process.env.GOOGLE_PRIVATE_KEY ? "OK" : "MISSING");

// ⚡ Middleware para log de requests
app.use((req, res, next) => {
  const isApi = req.originalUrl.startsWith("/api/");
  console.log("➡️ [REQ]", isApi ? "[API]" : "[FRONT]");
  console.log("   URL:", req.originalUrl);
  console.log("   Method:", req.method);
  next();
});

// ======================
// ⚡ Google Calendar
// ======================
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
    console.log("📅 Eventos de Google Calendar recibidos:");

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
// 🔨 helper: crear evento en Google Calendar (normaliza null → undefined)
// ======================
async function createCalendarEvent({
  date,
  time,
  summary,
  description,
}: {
  date: string;
  time: string;
  summary: string;
  description: string;
}): Promise<{ id?: string; htmlLink?: string }> {
  try {
    const start = new Date(`${date}T${time}:00-03:00`);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    const event = await calendar.events.insert({
      calendarId: CALENDAR_ID!,
      requestBody: {
        summary,
        description,
        start: { dateTime: start.toISOString(), timeZone: "America/Argentina/Buenos_Aires" },
        end: { dateTime: end.toISOString(), timeZone: "America/Argentina/Buenos_Aires" },
      },
    });

    // 🔧 normalizamos por si la API devuelve null
    const id = event.data.id ?? undefined;
    const htmlLink = event.data.htmlLink ?? undefined;

    console.log("📆 Evento creado:", id, htmlLink);
    return { id, htmlLink };
  } catch (err: any) {
    console.error("❌ Error creando evento:", err.response?.data || err.message);
    throw err;
  }
}

// ======================
// 📌 ENDPOINTS DE API
// ======================

// Agenda
app.get("/api/schedule", async (req, res) => {
  try {
    const schedule = await generateSchedule();
    res.json(schedule);
  } catch (err: any) {
    res.status(500).json({ error: "Error al generar agenda" });
  }
});

// Pago presencial (cash_home)
app.post("/api/confirm-onsite", async (req, res) => {
  console.log("💵 [/api/confirm-onsite] req.body crudo:", req.body);
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

    // ⚡ FIX: casteo a any igual que en MP_STATES
    const estado = (CASH_STATES as any).cash;

    const date = formData?.appointmentSlot?.date;
    const time = formData?.appointmentSlot?.time;
    if (!date || !time) throw new Error("Falta appointmentSlot (date/time)");

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

    await sendConfirmationEmail({
      recipient: TECHNICIAN_EMAIL,
      cc: formData?.email,
      fullName: formData?.fullName,
      phone: formData?.phone,
      appointment: `${date} ${time}`,
      address: formData?.address,
      location: formData?.location,
      coords: formData?.coords,
      quote,
      photos: formData?.photos,
      estado,
    });

    res.json({
      success: true,
      estado,
      calendarEventId,
      calendarEventLink: htmlLink,
    });
  } catch (err: any) {
    console.error("❌ [/api/confirm-onsite] Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});


// Crear preferencia
app.post("/api/create_preference", async (req, res) => {
  try {
    const { title, quantity, unit_price } = req.body;
    console.log("🟦 Crear preferencia:", { title, quantity, unit_price });

    const mpClient = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",
    });

    const preference = await new Preference(mpClient).create({
      body: {
        items: [
          {
            id: "service", // requerido por TS
            title,
            quantity,
            unit_price,
          },
        ],
        back_urls: {
          success: `${process.env.FRONTEND_URL}/success`,
          failure: `${process.env.FRONTEND_URL}/failure`,
          pending: `${process.env.FRONTEND_URL}/pending`,
        },
        auto_return: "approved",
      },
    });

    console.log("✅ Preferencia creada:", preference.id);
    res.json({ id: preference.id, preferenceId: preference.id });
  } catch (err: any) {
    console.error("❌ Error creando preferencia:", err.message);
    res.status(500).json({ error: "Error creando preferencia" });
  }
});

// ======================
// Confirmar pago Mercado Pago
// ======================
app.post("/api/confirm-payment", async (req, res) => {
  try {
    const { formData, quote, paymentId } = req.body;
    console.log("🔎 Confirmación de pago recibida:", { paymentId });

    const mpClient = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",
    });

    const payment = await new Payment(mpClient).get({ id: paymentId });

    const estadoCode: string = payment.status ?? "unknown";
    console.log("📦 Estado real de pago:", estadoCode);

    // Estado tipado + fallback seguro
    const estado = MP_STATES[estadoCode] ?? { code: estadoCode, label: "Estado desconocido" };

    // 🎯 Si está APROBADO y tenemos fecha/hora, creamos el evento en Calendar
    let calendarEventId: string | undefined;
    let calendarEventLink: string | undefined;

    const date: string | undefined = formData?.appointmentSlot?.date ?? undefined;
    const time: string | undefined = formData?.appointmentSlot?.time ?? undefined;

    if (estado.code === "approved" && date && time) {
      const { id, htmlLink } = await createCalendarEvent({
        date,
        time,
        summary: `Servicio técnico: ${formData?.serviceType || "Visita"}`,
        description:
          `Cliente: ${formData?.fullName || "-"} (${formData?.phone || "-"})\n` +
          `Dirección: ${formData?.address || "-"}\n` +
          `Localidad: ${formData?.location || "-"}\n` +
          `Pago: ${estado.label}\n` +
          `Total: ${new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" })
            .format(quote?.total ?? 0)}`,
      });

      calendarEventId = id;
      calendarEventLink = htmlLink;
    } else {
      console.log("🗒️ No se crea evento (no aprobado o falta fecha/hora).");
    }

    // 📧 Email de confirmación (no toco la firma existente)
    await sendConfirmationEmail({
      recipient: TECHNICIAN_EMAIL,
      cc: formData.email,
      fullName: formData.fullName,
      phone: formData.phone,
      appointment: `${formData.appointmentSlot?.date ?? "-"} ${formData.appointmentSlot?.time ?? ""}`.trim(),
      address: formData.address,
      location: formData.location,
      coords: formData.coords,
      quote,
      photos: formData.photos,
      estado,
      // si tu template soporta estos opcionales, podés agregarlos allí:
      // calendarEventId,
      // calendarEventLink,
    });

    return res.json({
      success: true,
      estado,
      calendarEventId,
      calendarEventLink,
    });
  } catch (err: any) {
    console.error("❌ Error confirmando pago:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// 📌 Servir frontend
// ======================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../dist")));
app.get(/^\/(?!api).*/, (req, res) => {
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
