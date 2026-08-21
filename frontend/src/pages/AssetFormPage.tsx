import { useNavigate } from "react-router-dom";
import { NotificationManager } from "../infrastructure/NotificationManager";
import { createAsset } from "../services/DeviceService";
import { useDeviceStore } from "../store/DeviceStore";
import type { AssetCreate } from "../domain/entities/Asset";

const notification = new NotificationManager();

export default function AssetFormPage() {
  const navigate = useNavigate();
  const addAsset = useDeviceStore((state) => state.addAsset);
  const goBack = () => navigate("/device/assets");

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload: AssetCreate = {
      name: formData.get("name")?.toString().trim() ?? "",
      type: formData.get("type")?.toString() as AssetCreate["type"],
      description: formData.get("description")?.toString().trim() ?? "",
      sensitive: formData.get("sensitive") === "on",
    };

    try {
      const asset = await createAsset(payload);
      addAsset(asset);
      notification.success("Asset creato correttamente");
      form.reset();
      goBack();
    } catch (err) {
      console.error("Errore creazione asset", err);
      notification.error(
        err instanceof Error ? err.message : "Errore durante la creazione dell'asset",
      );
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <button onClick={goBack}>Torna indietro</button>

      <h1>Nuovo Asset</h1>
      <form onSubmit={handleFormSubmit}>
        <p>Nome:</p>
        <input name="name" placeholder="Nome" />

        <p>Tipo:</p>
        <select name="type" defaultValue="network">
          <option value="network">Network</option>
          <option value="security">Security</option>
          <option value="privacy">Privacy</option>
          <option value="financial">Financial</option>
        </select>

        <p>Descrizione:</p>
        <input name="description" placeholder="Descrizione" />

        <p>
          <label>
            <input type="checkbox" name="sensitive" /> Asset sensibile
          </label>
        </p>

        <button type="submit">Invia</button>
      </form>
    </div>
  );
}
