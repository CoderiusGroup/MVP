import { useState} from "react";
import { NotificationManager } from "./infrastructure/NotificationManager";
import { FetchApiClient } from "./infrastructure/FetchApiClient";
import { DeviceSchema, DeviceCreateSchema, type Device } from "./domain/entities/Device";
import { parse } from "zod";

const apiClient = new FetchApiClient();
type Props = {
    onDeviceSaved: (device: Device, payload: unknown) => void;
}

export default function PaginaIniziale({onDeviceSaved}: Props){
    const notification = new NotificationManager();

    const readFileOnUpload = (uploadedFile?: File) => {
        if(!uploadedFile){
            notification.errorJsonLoading("Nessun file selezionato");
            return;
        }

        const isJsonFile = uploadedFile.name.toLowerCase().endsWith(".json") || uploadedFile.type === "application/json";
        if(!isJsonFile){
            notification.errorJsonLoading("Il file caricato non è un JSON valido");
            return;
        }


        const fileReader = new FileReader();
        fileReader.onloadend = async () =>{
            if(typeof fileReader.result !== "string"){
                console.log(fileReader.result)
                notification.errorJsonLoading("Errore durante la lettura del file");
                return;
            }

            try{
                const parsed = JSON.parse(fileReader.result);
                const result = DeviceCreateSchema.safeParse(parsed);
                if(!result.success){
                    notification.errorJsonLoading("Il file deve contenere un singolo dispositivo");
                    return;
                }
                const device = result.data;
                const savedDevice = await apiClient.post<Device>("/devices", device);
                onDeviceSaved(savedDevice, device);
                notification.success("Dispositivo caricato correttamente");
            }catch(e){
                console.error("Uploade error", e)
                notification.errorJsonLoading("Il file non è in formato Json");
            }
        }

        fileReader.onerror = () => {
            notification.errorJsonLoading("Errore durante il caricamento del file");
        };

        fileReader.readAsText(uploadedFile);
    }

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData =  new FormData(form);

        const device = {
            name: formData.get("name")?.toString().trim() ?? "",
            OperatingSystem: formData.get("OperatingSystem")?.toString().trim() ?? "",
            description: formData.get("description")?.toString().trim() ?? "",
        };

        if(!device.name){
            notification.errorJsonLoading("Il campo Nome è obbligatorio");
            return;
        }

        try{
            const raw = await apiClient.post<Device>("/devices", device);
            const savedDevice = DeviceSchema.parse(raw);
            onDeviceSaved(savedDevice,device);
            notification.success("Dispositivo creato correttamente");
            form.reset();
        }catch(e){
            console.error("Errore creazione dispositivo", e);
            notification.errorJsonLoading("Errore durante la creazione del dispositivo");
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
            <input name="OperatingSystem" placeholder="Sistema Operativo"/>
            <p>Descrizione:</p>
            <input name="description" placeholder="Descrizione"/>
            <button type="submit">Invia</button>
        </form>
    </div>
);
}