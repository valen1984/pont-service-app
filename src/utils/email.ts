import emailjs from "@emailjs/browser";

const SERVICE_ID = "service_tc9grzb";
const TEMPLATE_ID = "template_tz8tjid";
const PUBLIC_KEY = "zluZNGc1DA_MLUqMj";

export const sendConfirmationEmail = async ({
  recipient,
  fullName,
  phone,
  appointment,
  address,
  location,
  coords,
  quote,
  photos, // URLs de Cloudinary (0, 1 o 2)
}: {
  recipient: string;
  fullName: string;
  phone: string;
  appointment: string;
  address?: string;
  location?: string;
  coords?: { lat: number; lon: number };
  quote?: { baseCost: string; travelCost: string; subtotal: string; iva: string; total: string };
  photos?: string[];
}) => {
  const coordsText = coords
    ? `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`
    : "No disponible";

  const mapsLink = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lon}`
    : "";

  // ✅ Un único bloque HTML con las fotos (o fallback)
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
        photos_block, // 👈 esta variable va al template
      },
      PUBLIC_KEY
    );

    console.log("📧 Correo enviado a:", recipient);
  } catch (error) {
    console.error("❌ Error enviando email:", error);
    throw error;
  }
};
