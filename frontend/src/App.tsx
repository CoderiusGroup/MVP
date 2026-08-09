import { useState } from "react";
import { Toaster } from "react-hot-toast";
import "./App.css";
import "./infrastructure/FetchApiClient.ts";
import PaginaIniziale from "./PaginaIniziale.tsx";
import type { Device } from "./domain/entities/Device.ts";
import DeviceDetailPage from "./DeviceDetailPage";

function App() {
  const [device, setDevice] = useState<Device | null>(null);
  const [payload, setPayload] = useState<unknown>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleDeviceSaved = (savedDevice: Device, parsedPayload: unknown) => {
    setDevice(savedDevice);
    setPayload(parsedPayload);
    setShowDetails(true);
  };

  return (
    <>
      {showDetails ? (
        <DeviceDetailPage
          device={device}
          payload={payload}
          onBack={() => setShowDetails(false)}
        />
      ) : (
        <PaginaIniziale onDeviceSaved={handleDeviceSaved} />
      )}
    </>
  );
}

export default App;