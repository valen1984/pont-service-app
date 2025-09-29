import { MercadoPagoConfig, Payment } from "mercadopago";
import { ORDER_STATES, TECHNICIAN_EMAIL } from "./constants.js";
import { sendConfirmationEmail } from "./email.js";

export async function processPayment(paramData: any, formData: any, quote: any) {
  try {
    console.log("💳 [processPayment] paramData recibido:", JSON.stringify(paramData, null, 2));

    const mpClient = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",
    });

    // Extraer datos clave desde paramData
    const paymentData = paramData?.response?.payment || {};

    const payment = await new Payment(mpClient).create({
      body: {
        transaction_amount: quote.total,
        token: paymentData.token,
        description: "Servicio técnico Pont",
        installments: paymentData.installments || 1,
        payment_method_id: paymentData.payment_method_id,
        payer: {
          email: paymentData.payer?.email || formData.email,
        },
      },
    });

    console.log("✅ Pago creado en MP:", payment.id, payment.status);

    const estadoCode: string = payment.status ?? "unknown";
    const estado = ORDER_STATES[estadoCode] ?? ORDER_STATES.unknown;

    // Enviar email de confirmación al técnico y al cliente
    await sendConfirmationEmail({
      recipient: TECHNICIAN_EMAIL,
      cc: formData.email,
      fullName: formData.fullName,
      phone: formData.phone,
      appointment: `${formData.appointmentSlot?.date} ${formData.appointmentSlot?.time}`,
      address: formData.address,
      location: formData.location,
      coords: formData.coords,
      quote,
      photos: formData.photos,
      estado,
    });

    return { success: true, estado, paymentId: payment.id };
  } catch (err: any) {
    console.error("❌ [processPayment] Error:", err.message);
    return { success: false, error: err.message };
  }
}
