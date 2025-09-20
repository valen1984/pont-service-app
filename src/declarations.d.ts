declare module "*.png" {
  const value: string;
  export default value;
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EMAILJS_SERVICE_ID: string;
  readonly VITE_EMAILJS_TEMPLATE_ID: string;
  readonly VITE_EMAILJS_PUBLIC_KEY: string;
  readonly MERCADOPAGO_ACCESS_TOKEN: string;
  readonly BACKEND_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
