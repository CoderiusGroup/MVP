import { Toaster } from "react-hot-toast";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import DeviceFormPage from "./pages/DeviceFormPage";
import DeviceSummaryPage from "./pages/DeviceSummaryPage";
import DeviceAssetManagementPage from "./pages/DeviceAssetManagementPage";
import AssetFormPage from "./pages/AssetFormPage";
import { SessionRunnerPage } from "./pages/SessionRunnerPage";
import { ModifySessionPage } from "./pages/ModifySessionPage";
import { DecisionTreeCatalogPage } from "./pages/DecisionTreeCatalogPage";
import { RequireSession } from "./components/RequireSession";
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
    navigate("/device/assets"); 
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
        <Route path="/" element={<HomeRoute />} /> {}
        <Route path="/device/new" element={<DeviceFormPage />} /> 
        <Route path="/device" element={<DeviceSummaryPage />} />
        <Route
          path="/session"
          element={
            <RequireSession>
              <SessionRunnerPage />
            </RequireSession>
          }
        />
        <Route
          path="/session/modify"
          element={
            <RequireSession>
              <ModifySessionPage />
            </RequireSession>
          }
        />
        <Route path="/device/assets" element={<DeviceAssetManagementPage />} />
        <Route path="/device/assets/new" element={<AssetFormPage />} />
        <Route path="/device/assets/:assetId/edit" element={<AssetFormPage />} />
        <Route path="/decision-trees" element={<DecisionTreeCatalogPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;