// test-send.js
import sgMail from "@sendgrid/mail";

// ⚡ Configura tu API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function main() {
  const msg = {
    to: "valen1984@gmail.com", // 👈 probá con tu correo real
    from: {
      email: "pontserviciosderefrigeracion@gmail.com", // 👈 remitente validado en SendGrid
      name: "Pont Refrigeración",
    },
    subject: "🚀 Test de SendGrid",
    html: `
      <h1>Hola!</h1>
      <p>Este es un test de envío con <b>SendGrid</b>.</p>
      <p>Si ves este mail, significa que la configuración funciona ✅</p>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log("📩 Email enviado correctamente!");
  } catch (err) {
    console.error("❌ Error enviando:", err.response?.body || err.message);
  }
}

main();
