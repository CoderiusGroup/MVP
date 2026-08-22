import { Toaster } from "react-hot-toast";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import DeviceSummaryPage from "./pages/DeviceSummaryPage";
import DeviceAssetManagementPage from "./pages/DeviceAssetManagementPage";
import AssetFormPage from "./pages/AssetFormPage";
import { SessionRunnerPage } from "./pages/SessionRunnerPage";
import { ModifySessionPage } from "./pages/ModifySessionPage";
import type { Device } from "./domain/entities/Device.ts";
import type { Session } from "./domain/entities/Session.ts";
import { useDeviceStore } from "./store/DeviceStore";
import { useSessionStore } from "./store/SessionStore";

function HomeRoute() {
  const navigate = useNavigate();
  const setDevice = useDeviceStore((state) => state.setDevice);
  const resumeSession = useSessionStore((state) => state.resume);

  const handleDeviceSaved = (device: Device, payload: unknown) => {
    setDevice(device, payload);
    navigate("/device");
  };

  const handleSessionResumed = (session: Session) => {
    setDevice(session.device, null);
    resumeSession(session);
    navigate("/session");
  };

  return <HomePage onDeviceSaved={handleDeviceSaved} onSessionResumed={handleSessionResumed} />;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/device" element={<DeviceSummaryPage />} />
        <Route path="/session" element={<SessionRunnerPage />} />
        <Route path="/session/modify" element={<ModifySessionPage />} />
        <Route path="/device/assets" element={<DeviceAssetManagementPage />} />
        <Route path="/device/assets/new" element={<AssetFormPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
