import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { sendConfirmationEmail } from "./email.js";
import { TECHNICIAN_EMAIL } from "./constants.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ⚡ Credenciales (Railway → Variables de Entorno)
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// ======================
// 📌 Datos en memoria
// ======================

// Disponibilidad inicial (ejemplo: 7 días con horarios fijos)
const schedule = [
  {
    day: "Lunes",
    date: "2025-09-22",
    slots: [
      { time: "10:00", isAvailable: true },
      { time: "14:00", isAvailable: true },
      { time: "16:00", isAvailable: true },
    ],
  },
  {
    day: "Martes",
    date: "2025-09-23",
    slots: [
      { time: "10:00", isAvailable: true },
      { time: "14:00", isAvailable: true },
      { time: "16:00", isAvailable: true },
    ],
  },
  // 👉 podés agregar más días...
];

// Lista dinámica de turnos ocupados
let busySlots = [];

// ======================
// 📌 API Endpoints
// ======================

// Devuelve la disponibilidad semanal
app.get("/api/schedule", (req, res) => {
  res.json(schedule);
});

// Devuelve los turnos ocupados
app.get("/api/busy-slots", (req, res) => {
  res.json(busySlots);
});

// Reservar un turno (lo marca como ocupado)
app.post("/api/book-slot", (req, res) => {
  const { day, time } = req.body;

  if (!day || !time) {
    return res.status(400).json({ error: "Faltan parámetros (day, time)" });
  }

  // Verificamos si ya está ocupado
  const alreadyBusy = busySlots.some(
    (slot) => slot.day === day && slot.time === time
  );

  if (alreadyBusy) {
    return res.status(400).json({ error: "Turno ya ocupado" });
  }

  // Guardamos como ocupado
  busySlots.push({ day, time });
  console.log("📌 Nuevo turno reservado:", day, time);

  res.json({ success: true });
});

// ======================
// 📌 Pago con Mercado Pago
// ======================

app.post("/create_preference", async (req, res) => {
  try {
    const { title, quantity, unit_price, formData, quote } = req.body;

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [{ title, quantity, unit_price }],
        back_urls: {
          success: `${process.env.BACKEND_URL}/success`,
          failure: `${process.env.BACKEND_URL}/failure`,
          pending: `${process.env.BACKEND_URL}/pending`,
        },
        auto_return: "approved",
        metadata: {
          formData,
          quote,
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
        console.log("✅ Pago aprobado. Enviando correos...");

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

        // 👉 Guardamos el turno como ocupado
        if (formData.appointmentSlot) {
          busySlots.push(formData.appointmentSlot);
        }
      }

      if (status === "rejected") {
        console.log("❌ Pago rechazado. Avisando al cliente...");

        await sendConfirmationEmail({
          recipient: formData.email,
          fullName: formData.fullName,
          phone: formData.phone,
          appointment: "❌ Pago rechazado, el turno no fue confirmado",
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
// 📌 Servir frontend
// ======================

import path from "path";
import { fileURLToPath } from "url";
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
