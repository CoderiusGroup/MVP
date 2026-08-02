import { Link } from 'react-router'
import { requisiti, tipiAsset } from '../datiEsempio.js'

// UC-12.1: nome, tipo, descrizione, sensibilità e requisiti applicabili all'asset.
export default function AssetFormPage() {
  return (
    <>
      <h1>Dati dell&apos;asset</h1>
      <p className="sottotitolo">L&apos;asset viene associato al dispositivo in lavorazione.</p>

      <div className="riquadro">
        <div className="campo">
          <label htmlFor="nome-asset">Nome</label>
          <input id="nome-asset" type="text" defaultValue="Credenziali di accesso utente" />
        </div>

        <div className="campo">
          <label htmlFor="tipo-asset">Tipo</label>
          <select id="tipo-asset" defaultValue="security">
            {tipiAsset.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="descrizione-asset">Descrizione</label>
          <textarea
            id="descrizione-asset"
            defaultValue="Codici PIN e token memorizzati sul dispositivo."
          />
        </div>

        <div className="campo" style={{ marginBottom: 0 }}>
          <label>Asset sensibile</label>
          <div className="scelte">
            <label><input type="radio" name="sensibile" defaultChecked /> Sì</label>
            <label><input type="radio" name="sensibile" /> No</label>
          </div>
        </div>
      </div>

      <div className="riquadro">
        <h2>Requisiti da valutare</h2>
        <p className="nota" style={{ marginBottom: '0.8rem' }}>
          Proposti in base al tipo di asset selezionato.
        </p>
        <div className="elenco-requisiti">
          {requisiti.map(requisito => (
            <label key={requisito.codice}>
              <input type="checkbox" defaultChecked={requisito.codice.startsWith('ACM')} />
              <span><strong>{requisito.codice}</strong> — {requisito.nome}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="azioni azioni-fine">
        <Link className="pulsante" to="/dispositivo/asset">Annulla</Link>
        <Link className="pulsante pulsante-primario" to="/dispositivo/asset">Salva asset</Link>
      </div>
    </>
  )
}
