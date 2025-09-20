import express from "express";
import cors from "cors";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import bodyParser from "body-parser";
import { sendConfirmationEmail } from "./email.js"; 
import { TECHNICIAN_EMAIL } from "./constants.js"; 
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ⚡ Credenciales de prueba (sacadas de .env en Railway)
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// ======================================================
// Función para normalizar el presupuesto antes del mail
// ======================================================
const normalizeQuote = (quote) => ({
  baseCost: quote?.baseCost?.toString() ?? "0",
  travelCost:
    typeof quote?.travelCost === "string"
      ? quote.travelCost
      : quote?.travelCost?.toString() ?? "0",
  subtotal: quote?.subtotal?.toString() ?? "0",
  iva: quote?.iva?.toString() ?? "0",
  total: quote?.total?.toString() ?? "0",
});

// ======================================================
// Crear preferencia de pago
// ======================================================
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

// ======================================================
// Webhook de Mercado Pago
// ======================================================
app.post("/webhook", async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === "payment") {
      const paymentId = data.id;
      console.log("🔔 Pago recibido, consultando a Mercado Pago:", paymentId);

      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: paymentId });

      const status = payment.status; // "approved", "rejected", "pending"
      const metadata = payment.metadata || {};
      const formData = metadata.formData || {};
      const quote = normalizeQuote(metadata.quote || {});

      if (status === "approved") {
        console.log("✅ Pago aprobado. Enviando correos...");

        // Cliente
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

        // Técnico
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

// ======================================================
// Servir frontend compilado con Vite
// ======================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ======================================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
