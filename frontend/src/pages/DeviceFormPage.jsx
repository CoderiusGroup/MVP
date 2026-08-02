import { Link } from 'react-router'
import { dispositivo } from '../datiEsempio.js'

// UC-4.1: nome, sistema operativo e descrizione del dispositivo.
export default function DeviceFormPage() {
  return (
    <>
      <h1>Dati del dispositivo</h1>
      <p className="sottotitolo">Tutti i campi sono obbligatori.</p>

      <div className="riquadro">
        <div className="campo">
          <label htmlFor="nome">Nome</label>
          <input id="nome" type="text" defaultValue={dispositivo.nome} />
        </div>

        <div className="campo">
          <label htmlFor="so">Sistema operativo</label>
          <input id="so" type="text" defaultValue={dispositivo.sistemaOperativo} />
        </div>

        <div className="campo" style={{ marginBottom: 0 }}>
          <label htmlFor="descrizione">Descrizione</label>
          <textarea id="descrizione" defaultValue={dispositivo.descrizione} />
        </div>
      </div>

      <div className="azioni azioni-fine">
        <Link className="pulsante" to="/">Annulla</Link>
        <Link className="pulsante pulsante-primario" to="/dispositivo/asset">Continua</Link>
      </div>
    </>
  )
}
