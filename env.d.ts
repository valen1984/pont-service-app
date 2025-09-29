/// <reference types="vite/client" />

// 👉 Variables disponibles en el frontend (Vite)
interface ImportMetaEnv {
  readonly MODE: string; // 👈 ahora TS acepta import.meta.env.MODE
  readonly VITE_API_URL: string;
  readonly VITE_MERCADOPAGO_PUBLIC_KEY: string;
  readonly VITE_EMAILJS_SERVICE_ID: string;
  readonly VITE_EMAILJS_TEMPLATE_ID: string;
  readonly VITE_EMAILJS_PUBLIC_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// 👉 Variables disponibles en el backend (Node.js)
declare namespace NodeJS {
  interface ProcessEnv {
    // SendGrid
    SENDGRID_API_KEY: string;
    SENDGRID_TEMPLATE_UNICO: string;

    // MercadoPago
    MERCADOPAGO_ACCESS_TOKEN: string;

    // Frontend URL (si lo usás en mails/redirecciones)
    FRONTEND_URL: string;
  }
}
