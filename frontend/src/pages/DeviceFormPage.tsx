import { useLocation, useNavigate } from "react-router-dom";
import { Field } from "../components/Field";
import { Page } from "../components/Page";
import { NotificationManager } from "../infrastructure/NotificationManager";
import { createDeviceManually } from "../services/DeviceService";
import { useDeviceStore } from "../store/DeviceStore";

const notification = new NotificationManager();

export default function DeviceFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const device = useDeviceStore((state) => state.device);
  const setDevice = useDeviceStore((state) => state.setDevice);
  const updateDeviceDetails = useDeviceStore((state) => state.updateDeviceDetails);

  const isEditMode = location.pathname === "/device/edit";

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const patch = {
      name: formData.get("name")?.toString().trim() ?? "",
      operatingSystem: formData.get("operatingSystem")?.toString().trim() ?? "",
      description: formData.get("description")?.toString().trim() ?? "",
    };

    if (isEditMode) {
      updateDeviceDetails(patch);
      notification.success("Dispositivo aggiornato correttamente");
      navigate("/device");
      return;
    }

    try {
      const { device: savedDevice, payload } = await createDeviceManually(patch);
      setDevice(savedDevice, payload);
      notification.success("Dispositivo creato correttamente");
      navigate("/device/assets");
    } catch (e) {
      console.error("Errore creazione dispositivo", e);
      notification.errorWithFallback(
        e instanceof Error ? e.message : "Errore durante la creazione del dispositivo",
      );
    }
  };

  return (
    <Page
      title={isEditMode ? "Modifica dispositivo" : "Crea un nuovo dispositivo"}
      onBack={() => navigate(isEditMode ? "/device" : "/")}
    >
      <form onSubmit={handleFormSubmit}>
        <Field
          label="Nome"
          id="device-name"
          name="name"
          placeholder="Nome"
          defaultValue={device?.name}
          required
        />
        <Field
          label="Sistema operativo"
          id="device-os"
          name="operatingSystem"
          placeholder="Sistema Operativo"
          defaultValue={device?.operatingSystem}
          required
        />
        <Field
          label="Descrizione"
          id="device-description"
          name="description"
          placeholder="Descrizione"
          defaultValue={device?.description}
        />
        <button type="submit" className="btn btn--primary">
          {isEditMode ? "Salva modifiche" : "Salva e procedi agli asset"}
        </button>
      </form>
    </Page>
  );
}
