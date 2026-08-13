import { useState } from "react";
import { Toaster } from "react-hot-toast";
import "./App.css";
import HomePage from "./HomePage.tsx";
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
      <Toaster />
      {showDetails ? (
        <DeviceDetailPage
          device={device}
          payload={payload}
          onBack={() => setShowDetails(false)}
        />
      ) : (
        <HomePage onDeviceSaved={handleDeviceSaved} />
      )}
    </>
  );
}

export default App;
