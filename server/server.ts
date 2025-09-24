import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { sendConfirmationEmail } from "./email.js";
import { TECHNICIAN_EMAIL, ORDER_STATES } from "./constants.js";
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
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "", // 👈 forzamos string
});

// ⚡ Google Calendar Config
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
// 📌 Crear evento en Google Calendar
// ======================
async function createCalendarEvent(formData: any, quote: any) {
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

    const pad2 = (n: number) => String(n).padStart(2, "0");
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
      calendarId: CALENDAR_ID!,
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
        items: [{ id: "pont-service", title, quantity, unit_price }], // 👈 fix id
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

      let formData: any = {
        fullName: "⚠️ No informado",
        email: "pontserviciosderefrigeracion@gmail.com",
        phone: "⚠️ No informado",
        address: "",
        location: "",
        appointmentSlot: null,
      };

      let quote = {
        baseCost: "-",
        travelCost: "-",
        subtotal: "-",
        iva: "-",
        total: "-",
      };

      try {
        formData = metadata.formData
          ? JSON.parse(Buffer.from(metadata.formData, "base64").toString("utf8"))
          : formData;
      } catch {
        console.error("⚠️ No se pudo parsear formData:", metadata.formData);
      }

      try {
        quote = metadata.quote
          ? JSON.parse(Buffer.from(metadata.quote, "base64").toString("utf8"))
          : quote;
      } catch {
        console.error("⚠️ No se pudo parsear quote:", metadata.quote);
      }

      const estadoNormalizado: keyof typeof ORDER_STATES =
        status === "approved"
          ? "approved"
          : status === "rejected"
          ? "rejected"
          : "pending";

      await sendConfirmationEmail({
        recipient: formData.email || "pontserviciosderefrigeracion@gmail.com",
        cc: TECHNICIAN_EMAIL,
        ...formData,
        quote,
        estado: ORDER_STATES[estadoNormalizado],
      });

      if (estadoNormalizado === "approved" && formData.appointmentSlot) {
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
// 📌 Pago presencial
// ======================
app.post("/reservation/onsite", async (req, res) => {
  try {
    const { formData, quote } = req.body;

    await sendConfirmationEmail({
      recipient: formData.email || "pontserviciosderefrigeracion@gmail.com",
      cc: TECHNICIAN_EMAIL,
      ...formData,
      quote,
      estado: ORDER_STATES.cash_home,
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
        paymentStatus: ORDER_STATES.cash_home.code,
        paymentStatusLabel: ORDER_STATES.cash_home.label,
      },
    });
  } catch (err: any) {
    console.error("❌ Error en /reservation/onsite:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ======================
// 📌 Confirmación manual
// ======================
app.post("/api/confirm-payment", async (req, res) => {
  try {
    let { formData, quote, paymentId } = req.body;

    let estadoNormalizado: keyof typeof ORDER_STATES = "cash_home";

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

        estadoNormalizado = "approved";
      } catch (err: any) {
        console.error("❌ Error consultando MP:", err.message || err);
        return res
          .status(500)
          .json({ ok: false, error: "Error consultando Mercado Pago" });
      }
    }

    const estadoObj = ORDER_STATES[estadoNormalizado] || ORDER_STATES.unknown;

    await sendConfirmationEmail({
      recipient: formData.email || "pontserviciosderefrigeracion@gmail.com",
      cc: TECHNICIAN_EMAIL,
      ...formData,
      quote,
      estado: estadoObj,
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
        paymentStatus: estadoObj.code,
        paymentStatusLabel: estadoObj.label,
      },
    });
  } catch (err: any) {
    console.error("❌ Error en confirm-payment:", err);
    res.status(500).json({ ok: false, error: err.message });
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
