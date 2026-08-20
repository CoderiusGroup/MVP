import { Toaster } from "react-hot-toast";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import DeviceSummaryPage from "./pages/DeviceSummaryPage";
import DeviceAssetManagementPage from "./pages/DeviceAssetManagementPage";
import AssetFormPage from "./pages/AssetFormPage";
import { SessionRunnerPage } from "./pages/SessionRunnerPage";
import type { Device } from "./domain/entities/Device.ts";
import { useDeviceStore } from "./store/DeviceStore";

function HomeRoute() {
  const navigate = useNavigate();
  const setDevice = useDeviceStore((state) => state.setDevice);

  const handleDeviceSaved = (device: Device, payload: unknown) => {
    setDevice(device, payload);
    navigate("/device");
  };

  return <HomePage onDeviceSaved={handleDeviceSaved} />;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/device" element={<DeviceSummaryPage />} />
        <Route path="/device/assets" element={<DeviceAssetManagementPage />} />
        <Route path="/device/assets/new" element={<AssetFormPage />} />
        <Route path="/decision-tree/:requirementId" element={<SessionRunnerPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
