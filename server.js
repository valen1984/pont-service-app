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
        success: `${process.env.FRONTEND_URL}/#/success`,
        failure: `${process.env.FRONTEND_URL}/#/failure`,
        pending: `${process.env.FRONTEND_URL}/#/failure`
      },
auto_return: "approved",
        auto_return: "approved",
        metadata: { formData, quote }, // 👈 guardamos datos acá
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
// 📌 Webhook (opcional, para emails)
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

// ======================
// 📌 API Agenda
// ======================

function generateSchedule() {
  const today = new Date();
  const result = [];

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes...
    if (!WORKING_DAYS.includes(dayOfWeek)) continue; // solo lunes a sábado

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

      // 🔹 Bloquear turnos dentro de las próximas 48h
      const within48h = diffMs >= 0 && diffMs < 48 * 60 * 60 * 1000;

      const isBusy = busySlots.some(
        (s) => s.date === formattedDate && s.time === slotTime
      );

      slots.push({
        time: slotTime,
        isAvailable: !within48h && !isBusy,
      });
    }

    result.push({
      day: date.toLocaleDateString("es-AR", { weekday: "long" }),
      date: formattedDate,
      slots,
    });
  }

  return result;
}

