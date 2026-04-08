import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Camera, X } from 'lucide-react';

const BarcodeScanner = ({ onScan }) => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const codeReader = useRef(new BrowserMultiFormatReader());

  useEffect(() => {
    let active = true;
    const reader = codeReader.current;

    const startScanning = async () => {
      try {
        const videoInputDevices = await reader.listVideoInputDevices();
        if (videoInputDevices.length === 0) {
          if (active) setError('No camera found on this device.');
          return;
        }

        // Ideally use the environment facing camera
        const selectedDeviceId = videoInputDevices[0].deviceId;
        
        await reader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result) => {
            if (active && result) {
              onScan(result.getText());
            }
          }
        );
      } catch (err) {
        if (active) setError('Camera access denied or unavailable.');
        console.error(err);
      }
    };

    startScanning();

    return () => {
      active = false;
      reader.reset();
    };
  }, [onScan]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full overflow-hidden rounded-lg bg-black flex justify-center items-center h-64">
        {error ? (
          <p className="text-red-500 p-4 text-center">{error}</p>
        ) : (
          <video ref={videoRef} className="w-full h-full object-cover" />
        )}
      </div>
      <p className="mt-4 text-sm text-gray-500 font-medium flex items-center gap-2">
        <Camera className="w-4 h-4" /> Point camera at a barcode
      </p>
    </div>
  );
};

export default BarcodeScanner;
