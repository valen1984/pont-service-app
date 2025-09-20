import express from "express";
import cors from "cors";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import bodyParser from "body-parser";
import { sendConfirmationEmail } from "./src/components/utils/email.js"; // ajustá ruta según tu proyecto
import { TECHNICIAN_EMAIL } from "./src/constants.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ⚡ Credenciales de prueba
const client = new MercadoPagoConfig({
  accessToken:
    "APP_USR-2392101311737495-091810-eb6164ce895529dc2b39b582ff630dde-2700499442",
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
          success: "https://1f9e9f8f45cf.ngrok-free.app/success",
          failure: "https://1f9e9f8f45cf.ngrok-free.app/failure",
          pending: "https://1f9e9f8f45cf.ngrok-free.app/pending",
        },
        auto_return: "approved",
        metadata: {
          formData: JSON.stringify(formData),
          quote: JSON.stringify(quote),
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

      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: paymentId });

      const status = payment.status; // "approved", "rejected", "pending"
      console.log("📌 Estado del pago:", status);

      // Metadata parseada
      const metadata = payment.metadata || {};
      const formData = metadata.formData ? JSON.parse(metadata.formData) : {};
      const quote = metadata.quote ? JSON.parse(metadata.quote) : {};

      console.log("📩 Metadata recuperada:", { formData, quote });

      if (status === "approved") {
        console.log("✅ Pago aprobado. Enviando correos...");

        // Log extra antes de enviar
        console.log("DEBUG → Variables para EmailJS:", {
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
          recipient: formData.email,
          fullName: formData.fullName,
          phone: formData.phone,
          appointment: "✅ Pago confirmado, turno agendado",
          address: formData.address,
          location: formData.location,
          coords: formData.coords,
          quote: {
            baseCost: quote.baseCost?.toString() ?? "0",
            travelCost: quote.travelCost?.toString() ?? "0",
            subtotal: quote.subtotal?.toString() ?? "0",
            iva: quote.iva?.toString() ?? "0",
            total: quote.total?.toString() ?? "0",
          },
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
          quote: {
            baseCost: quote.baseCost?.toString() ?? "0",
            travelCost: quote.travelCost?.toString() ?? "0",
            subtotal: quote.subtotal?.toString() ?? "0",
            iva: quote.iva?.toString() ?? "0",
            total: quote.total?.toString() ?? "0",
          },
          photos: formData.photos,
        });
      }

      if (status === "rejected") {
        console.log("❌ Pago rechazado. Avisando al cliente...");

        console.log("DEBUG → Variables para EmailJS:", {
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

        await sendConfirmationEmail({
          recipient: formData.email,
          fullName: formData.fullName,
          phone: formData.phone,
          appointment: "❌ Pago rechazado, el turno no fue confirmado",
          address: formData.address,
          location: formData.location,
          coords: formData.coords,
          quote: {
            baseCost: quote.baseCost?.toString() ?? "0",
            travelCost: quote.travelCost?.toString() ?? "0",
            subtotal: quote.subtotal?.toString() ?? "0",
            iva: quote.iva?.toString() ?? "0",
            total: quote.total?.toString() ?? "0",
          },
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

app.listen(4000, () => {
  console.log("🚀 Servidor corriendo en http://localhost:4000");
});
