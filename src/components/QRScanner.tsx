import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScan: (studentId: string) => void;
}

export default function QRScanner({ onScan }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);

  // Always keep the latest scan function
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        const cameras = await Html5Qrcode.getCameras();

        if (!cameras || cameras.length === 0) {
          console.error("No camera found");
          return;
        }

        const cameraId =
          cameras.find((camera) =>
            camera.label.toLowerCase().includes("back")
          )?.id || cameras[0].id;

        await scanner.start(
          cameraId,
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250,
            },
          },
          (decodedText) => {
            onScanRef.current(decodedText);
          },
          () => {}
        );
      } catch (error) {
        console.error("QR scanner error:", error);
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      clearTimeout(timer);

      const currentScanner = scannerRef.current;

      if (currentScanner) {
        try {
          currentScanner.clear();
        } catch (error) {
          console.error("QR scanner cleanup error:", error);
        }

        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full">
      <div
        id="qr-reader"
        className="w-full max-w-md mx-auto rounded-lg overflow-hidden"
      />

      <p className="text-center text-sm mt-2 text-gray-500">
        Point the camera at the student's QR code
      </p>
    </div>
  );
}