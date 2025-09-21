import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { sendConfirmationEmail } from "./email.js";
import { TECHNICIAN_EMAIL } from "./constants.js";

import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ⚡ Credenciales de MP
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

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
          formData: JSON.stringify(formData), // 👈 guardamos como string
          quote: JSON.stringify(quote),       // 👈 guardamos como string
        },
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
// 📌 Webhook (para emails)
// ======================
app.post("/webhook", async (req, res) => {
  try {
    const { type, data } = req.body;
    if (type === "payment") {
      const paymentId = data.id;
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: paymentId });

      const status = payment.status;

      let formData = {};
      let quote = {};

      try {
        if (payment.metadata.formData) {
          formData = JSON.parse(payment.metadata.formData);
        }
        if (payment.metadata.quote) {
          quote = JSON.parse(payment.metadata.quote);
        }
      } catch (err) {
        console.error("❌ Error parseando metadata:", err);
      }

      if (status === "approved") {
        console.log("✅ Pago aprobado:", paymentId);

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
        });

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
// 📌 Consultar estado de un pago (Step7)
// ======================
app.get("/api/payment-status/:paymentId", async (req, res) => {
  try {
    const { paymentId } = req.params;
    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: paymentId });

    const status = payment.status;

    let formData = {};
    let quote = {};

    try {
      if (payment.metadata.formData) {
        formData = JSON.parse(payment.metadata.formData);
      }
      if (payment.metadata.quote) {
        quote = JSON.parse(payment.metadata.quote);
      }
    } catch (err) {
      console.error("❌ Error parseando metadata:", err);
    }

    res.json({ status, formData, quote });
  } catch (err) {
    console.error("❌ Error consultando pago:", err.message || err);
    res.status(404).json({ status: "error", message: "Pago no encontrado" });
  }
});

// ======================
// 📌 API Agenda (tu lógica original intacta)
// ======================
const WORKING_DAYS = [1, 2, 3, 4, 5, 6]; // Lunes a Sábado
const START_HOUR = 9;
const END_HOUR = 17;
const INTERVAL = 2;
let busySlots = [];

function generateSchedule() {
  const today = new Date();
  const result = [];

  for (let i = 0; i < 14; i++) {
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

      const isBusy = busySlots.some(
        (s) => s.date === formattedDate && s.time === slotTime
      );

      slots.push({
        time: slotTime,
        isAvailable: !within48h && !isBusy,
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

  return result;
}

app.get("/api/schedule", (req, res) => {
  res.json(generateSchedule());
});

app.get("/api/busy-slots", (req, res) => {
  res.json(busySlots);
});

app.post("/api/book-slot", (req, res) => {
  const { date, time } = req.body;
  if (!date || !time) {
    return res.status(400).json({ error: "Faltan parámetros (date, time)" });
  }

  const alreadyBusy = busySlots.some(
    (slot) => slot.date === date && slot.time === time
  );
  if (alreadyBusy) {
    return res.status(400).json({ error: "Turno ya ocupado" });
  }

  busySlots.push({ date, time });
  console.log("📌 Nuevo turno reservado:", date, time);
  res.json({ success: true });
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
