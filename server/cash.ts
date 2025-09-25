import { ORDER_STATES, TECHNICIAN_EMAIL } from "./constants.js";
import { sendConfirmationEmail } from "./email.js";

interface Quote {
  baseCost: string;
  travelCost: string;
  subtotal: string;
  iva: string;
  total: string;
}

interface Order {
  id: string;
  customerEmail: string;
  customerName?: string;
  appointment?: string;
  address?: string;
  location?: string;
  quote?: Quote;
}

export async function payCash(order: Order) {
  await sendConfirmationEmail({
    recipient: order.customerEmail,
    cc: TECHNICIAN_EMAIL,
    fullName: order.customerName,
    appointment: order.appointment,
    address: order.address,
    location: order.location,
    quote: order.quote,
    estado: ORDER_STATES.cash,
  });

  return {
    orderId: order.id,
    status: ORDER_STATES.cash.code,
    message: ORDER_STATES.cash.label,
  };
}
