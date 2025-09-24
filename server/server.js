import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { sendConfirmationEmail } from "./email.js";
import { TECHNICIAN_EMAIL } from "./constants.js";
import { ORDER_STATES } from "./constants.js";

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
// 📌 Crear evento en Google Calendar
// ======================
async function createCalendarEvent(formData, quote) {
  try {
    if (!formData.appointmentSlot) {
      console.warn("⚠️ No hay appointmentSlot en formData, no se crea evento");
      return;
    }

    const dateStr = formData.appointmentSlot.date;
    const timeStr = formData.appointmentSlot.time;

    const [hStr, mStr = "00"] = timeStr.split(":");
    const h = parseInt(hStr, 10);
    const endH = h + 2;

    const pad2 = (n) => String(n).padStart(2, "0");
    const endTimeStr = `${pad2(endH)}:${pad2(mStr)}`;

    const event = {
      summary: `Servicio: ${formData.serviceType || "Turno"} - ${formData.fullName}`,
      description: `Cliente: ${formData.fullName}\nTel: ${formData.phone}\nDirección: ${formData.address}\nServicio: ${formData.serviceType}\nTotal: $${quote?.total}`,
      start: {
        dateTime: `${dateStr}T${timeStr}:00`,
        timeZone: "America/Argentina/Buenos_Aires",
      },
      end: {
        dateTime: `${dateStr}T${endTimeStr}:00`,
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
        metadata: {
          formData: Buffer.from(JSON.stringify(formData)).toString("base64"),
          quote: Buffer.from(JSON.stringify(quote)).toString("base64"),
        },
      },
    });

    if (!result?.id) throw new Error("No se pudo crear preference en Mercado Pago");

    res.json({ id: result.id });
  } catch (error) {
    console.error("❌ Error creando preferencia:", error);
    res.status(500).json({ error: "Error creando preferencia" });
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

      const status = payment.status; // approved | pending | rejected
      const metadata = payment.metadata || {};

      // Defaults seguros
      let formData = {
        fullName: "⚠️ No informado",
        email: "pontserviciosderefrigeracion@gmail.com",
        phone: "⚠️ No informado",
        address: "",
        location: "",
        appointmentSlot: null,
      };
      let quote = {};

      try {
        formData = metadata.formData
          ? JSON.parse(Buffer.from(metadata.formData, "base64").toString("utf8"))
          : formData;
      } catch (e) {
        console.error("⚠️ No se pudo parsear formData:", metadata.formData);
      }

      try {
        quote = metadata.quote
          ? JSON.parse(Buffer.from(metadata.quote, "base64").toString("utf8"))
          : {};
      } catch (e) {
        console.error("⚠️ No se pudo parsear quote:", metadata.quote);
      }

      // 📌 Normalizar estado
      const estadoNormalizado =
        status === "approved"
          ? "confirmed"
          : status === "rejected"
          ? "rejected"
          : "pending";

      // 📧 Mandar mail cliente + CC técnico
      await sendConfirmationEmail({
        recipient: formData.email || "pontserviciosderefrigeracion@gmail.com",
        cc: TECHNICIAN_EMAIL,
        ...formData,
        quote,
        estado: estadoNormalizado,
      });

      // 📅 Calendar si corresponde
      if (estadoNormalizado === "confirmed" && formData.appointmentSlot) {
        await createCalendarEvent(formData, quote);
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

    await sendConfirmationEmail({
      recipient: formData.email || "pontserviciosderefrigeracion@gmail.com",
      cc: TECHNICIAN_EMAIL,
      ...formData,
      quote,
      estado: "onSite", // 👈 normalizado
    });

    if (formData.appointmentSlot) {
      await createCalendarEvent(formData, quote);
    }

    res.json({ ok: true, message: "📧 Correo de pago presencial enviado" });
  } catch (err) {
    console.error("❌ Error en /reservation/onsite:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ======================
// 📌 Confirmación manual de pago
// ======================
app.post("/api/confirm-payment", async (req, res) => {
  try {
    let { formData, quote, paymentId } = req.body;

    let estadoNormalizado = "onSite"; // default pago presencial

    if (paymentId) {
      console.log("📦 paymentId recibido:", paymentId);

      const paymentClient = new Payment(client);
      try {
        const payment = await paymentClient.get({ id: paymentId });
        console.log("🔎 Respuesta completa MP:", payment);

        if (payment.status !== "approved") {
          return res
            .status(400)
            .json({ ok: false, error: `El pago no está aprobado (estado: ${payment.status})` });
        }

        estadoNormalizado = "confirmed";
      } catch (err) {
        console.error("❌ Error consultando MP:", err.message || err);
        return res
          .status(500)
          .json({ ok: false, error: "Error consultando Mercado Pago" });
      }
    }

    await sendConfirmationEmail({
      recipient: formData.email || "pontserviciosderefrigeracion@gmail.com",
      cc: TECHNICIAN_EMAIL,
      ...formData,
      quote,
      estado: ORDER_STATES[estadoNormalizado].code,
      estadoLabel: ORDER_STATES[estadoNormalizado].label,
    });

    if (formData.appointmentSlot) {
      await createCalendarEvent(formData, quote);
    }

    res.json({
      ok: true,
      message: "Confirmación procesada",
      formData,
      quote: {
        ...quote,
        paymentStatus: ORDER_STATES[estadoNormalizado].code,
        paymentStatusLabel: ORDER_STATES[estadoNormalizado].label,
      },
    });
  } catch (err) {
    console.error("❌ Error en confirm-payment:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ======================
// 📌 Agenda con Google Calendar
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

    const events = eventsRes.data.items || [];

    const WORKING_DAYS = [1, 2, 3, 4, 5, 6];
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

app.use(express.static(path.join(__dirname, "../dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
