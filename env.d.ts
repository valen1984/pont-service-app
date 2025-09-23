declare namespace NodeJS {
  interface ProcessEnv {
    // SendGrid
    SENDGRID_API_KEY: string;
    SENDGRID_TEMPLATE_UNICO: string;

    // MercadoPago
    MERCADOPAGO_ACCESS_TOKEN: string;
    VITE_MERCADOPAGO_PUBLIC_KEY: string;

    // API
    VITE_API_URL: string;

    // EmailJS (opcional, si todavía lo usás en frontend)
    VITE_EMAILJS_SERVICE_ID: string;
    VITE_EMAILJS_TEMPLATE_ID: string;
    VITE_EMAILJS_PUBLIC_KEY: string;
  }
}
