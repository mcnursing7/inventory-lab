"use client";

import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

export type BarcodeScannerProps = {
  active: boolean;
  onScan: (text: string) => void;
  fps?: number;
  qrbox?: { width: number; height: number };
};

export default function BarcodeScanner({
  active,
  onScan,
  fps = 10,
  qrbox = { width: 250, height: 250 },
}: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrcodeRef = useRef<any>(null);

  useEffect(() => {
    if (!active || !scannerRef.current) return;

    const elementId = scannerRef.current.id;
    html5QrcodeRef.current = new Html5Qrcode(elementId);

    html5QrcodeRef.current
      .start(
        { facingMode: "environment" },
        { fps, qrbox },
        (decodedText: string) => {
          onScan(decodedText);
        },
        (errorMessage: any) => {
          console.debug("Scan error:", errorMessage);
        }
      )
      .catch((err: any) => console.error("Failed to start scanner:", err));

    return () => {
      html5QrcodeRef.current
        ?.stop()
        .then(() => html5QrcodeRef.current?.clear())
        .catch(() => {});
      html5QrcodeRef.current = null;
    };
  }, [active, onScan, fps, qrbox]);

  return (
    <div
      id="barcode-scanner"
      ref={scannerRef}
      className={active ? "block w-full max-w-md aspect-video mx-auto rounded-lg overflow-hidden" : "hidden"}
      style={{ backgroundColor: "#000" }}
    />
  );
}
