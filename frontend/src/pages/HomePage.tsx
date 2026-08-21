import { NotificationManager } from "../infrastructure/NotificationManager";
import { importDeviceFromJson, createDeviceManually } from "../services/DeviceService";
import { loadSessionFromJson } from "../services/SessionService";
import type { Device } from "../domain/entities/Device";
import type { Session } from "../domain/entities/Session";

type Props = {
    onDeviceSaved: (device: Device, payload: unknown) => void;
    onSessionResumed: (session: Session) => void;
}

const notification = new NotificationManager();

export default function HomePage({onDeviceSaved, onSessionResumed}: Props){

    const resumeSessionOnUpload = async (uploadedFile?: File) => {
        if(!uploadedFile){
            notification.errorJsonLoading("Nessun file selezionato");
            return;
        }

        try{
            const session = await loadSessionFromJson(uploadedFile);
            onSessionResumed(session);
            notification.success("Sessione ripresa correttamente");
        }catch(e){
            console.error("Resume error", e);
            notification.errorJsonLoading(e instanceof Error ? e.message : "Errore durante il caricamento della sessione");
        }
    }

    const readFileOnUpload = async (uploadedFile?: File) => {
        if(!uploadedFile){
            notification.errorJsonLoading("Nessun file selezionato");
            return;
        }

        try{
            const { device, payload } = await importDeviceFromJson(uploadedFile);
            onDeviceSaved(device, payload);
            notification.success("Dispositivo caricato correttamente");
        }catch(e){
            console.error("Uploade error", e)
            notification.errorJsonLoading(e instanceof Error ? e.message : "Errore durante il caricamento del file");
        }
    }

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData =  new FormData(form);

        const device = {
            name: formData.get("name")?.toString().trim() ?? "",
            operatingSystem: formData.get("operatingSystem")?.toString().trim() ?? "",
            description: formData.get("description")?.toString().trim() ?? "",
        };

        try{
            const { device: savedDevice, payload } = await createDeviceManually(device);
            onDeviceSaved(savedDevice, payload);
            notification.success("Dispositivo creato correttamente");
            form.reset();
        }catch(e){
            console.error("Errore creazione dispositivo", e);
            notification.errorJsonLoading(e instanceof Error ? e.message : "Errore durante la creazione del dispositivo");
        }
    }

return (
    <div className="space-y-4">
        <h2>Bottone per inserire un file JSOn</h2>
        <input
        type="file"
        aria-label="Carica file JSON dispositivo"
        accept = "application/json,.json"
        onChange={(e) => readFileOnUpload(e.target.files?.[0])}/>
        <h2>Form per creare un dispositivo</h2>
        <form onSubmit={handleFormSubmit}>
            <p>Nome:</p>
            <input name="name" placeholder="Nome"/>
            <p>Sistema Operativo:</p>
            <input name="operatingSystem" placeholder="Sistema Operativo"/>
            <p>Descrizione:</p>
            <input name="description" placeholder="Descrizione"/>
            <button type="submit">Invia</button>
        </form>
        <h2>Riprendi una sessione salvata</h2>
        <input
        type="file"
        aria-label="Riprendi sessione da file"
        accept="application/json,.json"
        onChange={(e) => resumeSessionOnUpload(e.target.files?.[0])}/>
    </div>
);
}
