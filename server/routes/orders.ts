const mapped = mapStatus(order.status);

await sendConfirmationEmail({
  email: order.customerEmail,
  cc: "pontserviciosderefrigeracion@gmail.com",
  fullName: order.customerName,
  phone: order.customerPhone,
  appointment: order.appointmentDate,
  address: order.address,
  location: order.location,
  coords: order.coords,
  quote: order.quote,
  photos: order.photos,
  estado: mapped, // 👈 ahora pasamos el objeto completo
});
