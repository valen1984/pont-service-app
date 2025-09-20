import emailjs from "@emailjs/browser";

const SERVICE_ID = process.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = process.env.VITE_EMAILJS_PUBLIC_KEY;

export const sendConfirmationEmail = async ({
  recipient,
  fullName,
  phone,
  appointment,
  address,
  location,
  coords,
  quote,
  photos,
}) => {
  const coordsText = coords
    ? `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`
    : "No disponible";
  const mapsLink = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lon}`
    : "";

  const photos_block =
    photos && photos.length > 0
      ? photos
          .slice(0, 2)
          .map(
            (url) =>
              `<img src="${url}" width="200" style="margin-right:8px;border-radius:8px;"/>`
          )
          .join("")
      : `<span style="color:#64748b;">No adjuntadas</span>`;

  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: recipient,
        full_name: fullName,
        phone: phone || "No especificado",
        appointment,
        address: address || "No especificada",
        location: location || "No especificada",
        coords: coordsText,
        maps_link: mapsLink,
        base_cost: quote?.baseCost ?? "",
        travel_cost: quote?.travelCost ?? "",
        subtotal: quote?.subtotal ?? "",
        iva: quote?.iva ?? "",
        total: quote?.total ?? "",
        photos_block,
      },
      PUBLIC_KEY
    );

    console.log("📧 Correo enviado a:", recipient);
  } catch (error) {
    console.error("❌ Error enviando email:", error);
    throw error;
  }
};
