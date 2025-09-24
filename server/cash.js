import { ORDER_STATES } from "./constants.js";
import { sendConfirmationEmail } from "./email.js";

export function payAtHome(order) {
  // Crear confirmación por mail
  sendConfirmationEmail({
    to: order.customerEmail,
    subject: "Pago en domicilio confirmado",
    text: `El cliente abonará en domicilio. Servicio: ${order.service}`,
  });

  // Podrías también disparar un evento de calendario acá

  return {
    orderId: order.id,
    status: ORDER_STATES.CASH_HOME,
    message: "El cliente abonará en domicilio",
  };
}

export function payAtWorkshop(order) {
  sendConfirmationEmail({
    to: order.customerEmail,
    subject: "Pago en taller confirmado",
    text: `El cliente abonará en el taller. Servicio: ${order.service}`,
  });

  return {
    orderId: order.id,
    status: ORDER_STATES.CASH_WORKSHOP,
    message: "El cliente abonará en taller",
  };
}
