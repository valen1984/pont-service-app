import "react";

declare module "@mercadopago/sdk-react" {
  interface WalletProps {
    initialization: { preferenceId: string };
    onSubmit?: (param: any) => void;
    onReady?: () => void;
    onError?: (err: any) => void;
  }
}
