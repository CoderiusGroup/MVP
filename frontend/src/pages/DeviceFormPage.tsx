import { useNavigate } from "react-router-dom";
import { NotificationManager } from "../infrastructure/NotificationManager";
import { createDeviceManually } from "../services/DeviceService";
import { useDeviceStore } from "../store/DeviceStore";

const notification = new NotificationManager();

export default function DeviceFormPage() {
    const navigate = useNavigate();
    const setDevice = useDeviceStore((state) => state.setDevice);

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);

        const device = {
            name: formData.get("name")?.toString().trim() ?? "",
            operatingSystem: formData.get("operatingSystem")?.toString().trim() ?? "",
            description: formData.get("description")?.toString().trim() ?? "",
        };

        try {
            const { device: savedDevice, payload } = await createDeviceManually(device);
            setDevice(savedDevice, payload);
            notification.success("Dispositivo creato correttamente");
            navigate("/device/assets");
        } catch (e) {
            console.error("Errore creazione dispositivo", e);
            notification.errorJsonLoading(e instanceof Error ? e.message : "Errore durante la creazione del dispositivo");
        }
    };

    return (
        <div className="space-y-4" style={{ padding: "1rem" }}>
            <button onClick={() => navigate("/")}>Torna indietro</button>
            <h2>Crea un nuovo dispositivo</h2>
            <form onSubmit={handleFormSubmit}>
                <p>Nome:</p>
                <input name="name" placeholder="Nome" required />
                <p>Sistema Operativo:</p>
                <input name="operatingSystem" placeholder="Sistema Operativo" required />
                <p>Descrizione:</p>
                <input name="description" placeholder="Descrizione" />
                <br /><br />
                <button type="submit">Salva e procedi agli asset</button>
            </form>
        </div>
    );
}