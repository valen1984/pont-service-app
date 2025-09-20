import express from "express";
import cors from "cors";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import bodyParser from "body-parser";
import { sendConfirmationEmail } from "./email.js"; // 👈 import corregido
import { TECHNICIAN_EMAIL } from "./constants.js"; // lo podés mover al backend si querés

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ⚡ Credenciales de prueba (sacadas de .env en Railway)
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// Crear preferencia
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

// Webhook de Mercado Pago
app.post("/webhook", async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === "payment") {
      const paymentId = data.id;

      console.log("🔔 Pago recibido, consultando a Mercado Pago:", paymentId);

      // Consultamos el pago real
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: paymentId });

      const status = payment.status; // "approved", "rejected", "pending"
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⚡ Servir archivos estáticos de Vite compilado
app.use(express.static(path.join(__dirname, "dist")));

// ⚡ Cualquier ruta que no sea API, que devuelva index.html (para React Router)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});