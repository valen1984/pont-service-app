import express from "express";
import { sendConfirmationEmail } from "../email.js";
import { mapStatus } from "../statusMapper.js"; // 👈 asegurate que la ruta sea correcta

const router = express.Router();

/**
 * Endpoint para confirmar/actualizar orden
 */
router.post("/update-order", async (req, res) => {
  try {
    const order = req.body;
    // order: { customerName, customerEmail, customerPhone, address, location, coords, quote, appointmentDate, photos, status }

    // 🔄 Normalizamos el estado recibido (venga de MP, manual o legacy)
    const mapped = mapStatus(order.status);

    // 🚀 Enviar mail al cliente y en copia al técnico
    await sendConfirmationEmail({
      recipient: order.customerEmail, // 👈 ahora usamos recipient
      cc: "pontserviciosderefrigeracion@gmail.com", // 👈 conservamos CC
      fullName: order.customerName,
      phone: order.customerPhone,
      appointment: order.appointmentDate,
      address: order.address,
      location: order.location,
      coords: order.coords,
      quote: order.quote,
      photos: order.photos,
      estado: mapped, // 👈 pasamos el objeto { code, label }
    });

    res.json({
      success: true,
      message: `Correo de confirmación enviado ✅ (${mapped.code})`,
    });
  } catch (err: any) {
    console.error("❌ Error enviando mail:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
