import { useNavigate, useParams } from "react-router-dom";
import { Field, SelectField } from "../components/Field";
import { Page } from "../components/Page";
import { NotificationManager } from "../infrastructure/NotificationManager";
import { createAsset, updateAsset } from "../services/DeviceService";
import { useDeviceStore } from "../store/DeviceStore";
import type { Asset, AssetCreate } from "../domain/entities/Asset";

const notification = new NotificationManager();
const EMPTY_ASSETS: Asset[] = [];

export default function AssetFormPage() {
  const navigate = useNavigate();
  const { assetId } = useParams<{ assetId?: string }>();
  const assets = useDeviceStore((state) => state.device?.assets ?? EMPTY_ASSETS);
  const addAsset = useDeviceStore((state) => state.addAsset);
  const updateAssetInStore = useDeviceStore((state) => state.updateAsset);
  const goBack = () => navigate("/device/assets");

  const isEditMode = Boolean(assetId);
  const existingAsset = assetId ? assets.find((asset) => asset.id === assetId) : undefined;

  if (isEditMode && !existingAsset) {
    return (
      <Page title="Asset" onBack={goBack}>
        <p className="empty-state">Asset non trovato.</p>
      </Page>
    );
  }

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
      if (existingAsset) {
        const asset = await updateAsset(existingAsset, payload);
        updateAssetInStore(asset);
        notification.success("Asset aggiornato correttamente");
      } else {
        const asset = await createAsset(payload);
        addAsset(asset);
        notification.success("Asset creato correttamente");
      }
      form.reset();
      goBack();
    } catch (err) {
      console.error("Errore salvataggio asset", err);
      notification.error(
        err instanceof Error ? err.message : "Errore durante il salvataggio dell'asset",
      );
    }
  };

  return (
    <Page title={existingAsset ? "Modifica Asset" : "Nuovo Asset"} onBack={goBack}>
      <form onSubmit={handleFormSubmit}>
        <Field
          label="Nome"
          id="asset-name"
          name="name"
          placeholder="Nome"
          defaultValue={existingAsset?.name}
        />
        <SelectField
          label="Tipo"
          id="asset-type"
          name="type"
          defaultValue={existingAsset?.type ?? "network"}
        >
          <option value="network">Network</option>
          <option value="security">Security</option>
          <option value="privacy">Privacy</option>
          <option value="financial">Financial</option>
        </SelectField>
        <Field
          label="Descrizione"
          id="asset-description"
          name="description"
          placeholder="Descrizione"
          defaultValue={existingAsset?.description}
        />
        <label className="field field--checkbox">
          <input type="checkbox" name="sensitive" defaultChecked={existingAsset?.sensitive} />
          Asset sensibile
        </label>
        <button type="submit" className="btn btn--primary">
          Invia
        </button>
      </form>
    </Page>
  );
}
