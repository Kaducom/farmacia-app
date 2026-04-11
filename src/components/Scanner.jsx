import { BrowserMultiFormatReader } from "@zxing/browser";
import { useEffect } from "react";

function Scanner({ onScan }) {
  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let active = true;

    async function start() {
      try {
        const devices = await codeReader.listVideoInputDevices();

        const selectedDeviceId =
          devices.find(d =>
            d.label.toLowerCase().includes("back")
          )?.deviceId || devices[0]?.deviceId;

        await codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          "video",
          (result, err) => {
            if (result && active) {
              onScan(result.getText());
              codeReader.reset();
            }
          }
        );
      } catch (err) {
        console.error("Erro scanner:", err);
      }
    }

    start();

    return () => {
      active = false;
      codeReader.reset();
    };
  }, []);

  return (
    <video
      id="video"
      className="w-full rounded-xl"
      style={{ maxHeight: "300px" }}
    />
  );
}

export default Scanner;