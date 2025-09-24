import express from "express";
import { MercadoPagoConfig, Preference } from "mercadopago";

const router = express.Router();

// ⚡ Configuración del SDK de Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN, // 👈 tu token privado
});

router.post("/create_preference", async (req, res) => {
  try {
    const { title, quantity, unit_price, formData, quote } = req.body;

    console.log("🟢 Creando preferencia con:", {
      title,
      quantity,
      unit_price,
    });

    const preference = await new Preference(client).create({
      body: {
        items: [
          {
            title: title || "Servicio técnico",
            quantity: Number(quantity) || 1,
            unit_price: Number(unit_price) || 0,
          },
        ],
        back_urls: {
          success: `${process.env.FRONTEND_URL}/?status=approved`,
          pending: `${process.env.FRONTEND_URL}/?status=pending`,
          failure: `${process.env.FRONTEND_URL}/?status=rejected`,
        },
        auto_return: "approved",
        metadata: {
          formData,
          quote,
        },
      },
    });

    console.log("📦 Preferencia creada:", preference);

    // 🔹 IMPORTANTE: devolver siempre { preferenceId }
    res.json({ preferenceId: preference.id });
  } catch (err) {
    console.error("❌ Error creando preferencia:", err);
    res.status(500).json({ error: "No se pudo crear la preferencia" });
  }
});

export default router;
