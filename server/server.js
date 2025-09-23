import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import {
  sendConfirmationEmail,
  sendPaymentRejectedEmail,
  sendOnSiteReservationEmail,
  sendPaymentPendingEmail,
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
// 📌 Crear evento en Google Calendar
// ======================
async function createCalendarEvent(formData, quote) {
  try {
    console.log("📅 Datos recibidos para Calendar:", formData);
    if (!formData.appointmentSlot) {
      console.warn("⚠️ No hay appointmentSlot en formData, no se crea evento");
      return;
    }

    const dateStr = formData.appointmentSlot.date;
    const timeStr = formData.appointmentSlot.time;
    console.log("📅 Creando evento con:", { dateStr, timeStr });

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

    console.log("🗓️ Creando evento con TZ Buenos Aires:", event);

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
          // ✅ encode en base64
          formData: Buffer.from(JSON.stringify(formData)).toString("base64"),
          quote: Buffer.from(JSON.stringify(quote)).toString("base64"),
        },
      },
    });

    if (!result || !result.id) {
      throw new Error("No se pudo crear preference en Mercado Pago");
    }

    console.log("✅ Preference creada:", result.id);
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
    console.log("📩 Webhook recibido:", JSON.stringify(req.body, null, 2));

    const { type, data } = req.body;
    if (type === "payment") {
      const paymentId = data.id;
      console.log("🔎 Procesando pago:", paymentId);

      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: paymentId });

      const status = payment.status;
      const metadata = payment.metadata || {};

      let formData = {};
      let quote = {};
      try {
        formData = metadata.formData
          ? JSON.parse(Buffer.from(metadata.formData, "base64").toString("utf8"))
          : {};
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

      console.log("📝 formData parseado:", formData);
      console.log("📝 quote parseado:", quote);

      if (status === "approved") {
        console.log("✅ Pago aprobado:", paymentId);

        await sendConfirmationEmail({
          recipient: formData.email,
          ...formData,
          quote,
          paymentStatus: "confirmed",
        });
        await sendConfirmationEmail({
          recipient: TECHNICIAN_EMAIL,
          ...formData,
          quote,
          paymentStatus: "confirmed",
        });

        if (formData.appointmentSlot) {
          await createCalendarEvent(formData, quote);
        } else {
          console.warn("⚠️ Pago aprobado pero sin appointmentSlot, no se crea evento");
        }
      }

      if (status === "pending") {
        console.log("⏳ Pago pendiente:", paymentId);

        await sendPaymentPendingEmail({
          recipient: formData.email,
          ...formData,
          quote,
        });
        await sendPaymentPendingEmail({
          recipient: TECHNICIAN_EMAIL,
          ...formData,
          quote,
        });

        if (formData.appointmentSlot) {
          await createCalendarEvent(formData, quote);
        } else {
          console.warn("⚠️ Pago pendiente pero sin appointmentSlot");
        }
      }

      if (status === "rejected") {
        console.log("❌ Pago rechazado:", paymentId);

        await sendPaymentRejectedEmail({
          recipient: formData.email,
          ...formData,
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
// 📌 Consultar estado de un pago (para Step7)
// ======================
app.get("/api/payment-status/:paymentId", async (req, res) => {
  try {
    const { paymentId } = req.params;
    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: paymentId });

    const status = payment.status;
    const metadata = payment.metadata || {};

    let formData = {};
    let quote = {};
    try {
      formData = metadata.formData
        ? JSON.parse(Buffer.from(metadata.formData, "base64").toString("utf8"))
        : {};
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

    res.json({ status, formData, quote });
  } catch (err) {
    console.error("❌ Error consultando pago:", err.message || err);
    res.status(404).json({ status: "error", message: "Pago no encontrado" });
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

    await createCalendarEvent(formData, quote);

    res.json({ ok: true, message: "📧 Correo de pago presencial enviado" });
  } catch (err) {
    console.error("❌ Error en /reservation/onsite:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ======================
// 📌 Agenda con Google Calendar (fix TZ Buenos Aires, sin domingos)
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

// ======================
// 📌 Confirmación manual de pago (con logs detallados)
// ======================
app.post("/api/confirm-payment", async (req, res) => {
  try {
    const { formData, quote, paymentId } = req.body;

    console.log("🔎 Confirmación manual recibida:", { paymentId });
    console.log("📥 formData recibido:", JSON.stringify(formData, null, 2));
    console.log("📥 quote recibido:", JSON.stringify(quote, null, 2));

    if (paymentId) {
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: paymentId });

      console.log("💳 Estado real de pago en MP:", payment.status);

      if (payment.status !== "approved") {
        return res.status(400).json({ ok: false, error: "El pago no está aprobado" });
      }
    }

    // 🔎 Logs específicos
    console.log("🛠️ Debug fields:");
    console.log("   ➡️ Servicio:", formData?.serviceType);
    console.log("   ➡️ Dirección:", formData?.address);
    console.log("   ➡️ Fecha:", formData?.appointmentSlot?.date);
    console.log("   ➡️ Hora:", formData?.appointmentSlot?.time);

    // 🔹 Reutilizamos la misma lógica de onsite
    await sendOnSiteReservationEmail({
      recipient: formData.email,
      ...formData,
      quote,
    });
    await sendOnSiteReservationEmail({
      recipient: TECHNICIAN_EMAIL,
      ...formData,
      quote,
    });

    if (formData.appointmentSlot) {
      await createCalendarEvent(formData, quote);
    } else {
      console.warn("⚠️ Confirmación recibida sin appointmentSlot");
    }

    res.json({
      ok: true,
      message: "Confirmación procesada",
      formData,
      quote: { ...quote, paymentStatus: "confirmed" },
    });
  } catch (err) {
    console.error("❌ Error en confirm-payment:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});
