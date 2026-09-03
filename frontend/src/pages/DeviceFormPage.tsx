import { useLocation, useNavigate } from "react-router-dom";
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
            notification.errorWithFallback(e instanceof Error ? e.message : "Errore durante la creazione del dispositivo");
        }
    };

    return (
        <div className="space-y-4" style={{ padding: "1rem" }}>
            <button onClick={() => navigate(isEditMode ? "/device" : "/")}>Torna indietro</button>
            <h2>{isEditMode ? "Modifica dispositivo" : "Crea un nuovo dispositivo"}</h2>
            <form onSubmit={handleFormSubmit}>
                <p>Nome:</p>
                <input name="name" placeholder="Nome" defaultValue={device?.name} required />
                <p>Sistema Operativo:</p>
                <input
                    name="operatingSystem"
                    placeholder="Sistema Operativo"
                    defaultValue={device?.operatingSystem}
                    required
                />
                <p>Descrizione:</p>
                <input name="description" placeholder="Descrizione" defaultValue={device?.description} />
                <br /><br />
                <button type="submit">
                    {isEditMode ? "Salva modifiche" : "Salva e procedi agli asset"}
                </button>
            </form>
        </div>
    );
}
