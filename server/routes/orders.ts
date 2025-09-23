import express from "express";
import { sendConfirmationEmail } from "@/utils/email";

const router = express.Router();

// Endpoint para confirmar una orden
router.post("/update-order", async (req, res) => {
  try {
    const order = req.body;
    // order: { customerName, customerEmail, customerPhone, address, location, coords, quote, appointmentDate, photos, status }

    let subjectEstado = "";
    switch (order.status) {
      case "CONFIRMADA":
        subjectEstado = "✅ Tu orden fue confirmada";
        break;
      case "PENDIENTE":
        subjectEstado = "⏳ Tu orden está pendiente";
        break;
      case "RECHAZADA":
        subjectEstado = "❌ Tu orden fue rechazada";
        break;
      case "CANCELADA":
        subjectEstado = "⚠️ Tu orden fue cancelada";
        break;
      default:
        subjectEstado = "📩 Actualización de tu orden";
    }

    // 🚀 Enviar mail al cliente y en copia al dueño
    await sendConfirmationEmail({
      recipient: order.customerEmail,
      cc: "pontrefrigeracion@gmail.com", // copia al dueño
      fullName: order.customerName,
      phone: order.customerPhone,
      appointment: order.appointmentDate,
      address: order.address,
      location: order.location,
      coords: order.coords,
      quote: order.quote,
      photos: order.photos,
      estado: order.status, // CONFIRMADA | PENDIENTE | RECHAZADA
    });

    res.json({ success: true, message: "Correo de confirmación enviado ✅" });
  } catch (err: any) {
    console.error("❌ Error enviando mail:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
