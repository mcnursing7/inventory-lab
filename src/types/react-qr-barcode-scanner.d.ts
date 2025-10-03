declare module "react-qr-barcode-scanner" {
  import * as React from "react";

  interface BarcodeScannerComponentProps {
    width?: number;
    height?: number;
    onUpdate?: (err: unknown, result: { getText: () => string } | null) => void;
  }

  export default class BarcodeScannerComponent extends React.Component<
    BarcodeScannerComponentProps
  > {}
}
