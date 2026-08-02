import { Link } from 'react-router'
import Esito from '../components/Esito.jsx'
import { asset, dispositivo } from '../datiEsempio.js'

// UC-14: elenco degli asset del dispositivo, con nome, tipo e stato di valutazione.
export default function DeviceAssetManagementPage() {
  return (
    <>
      <h1>Asset del dispositivo</h1>
      <p className="sottotitolo">{dispositivo.nome} — {asset.length} asset</p>

      <div className="riquadro">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Sensibile</th>
              <th>Stato</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {asset.map(voce => (
              <tr key={voce.id}>
                <td>{voce.nome}</td>
                <td>{voce.tipo}</td>
                <td>{voce.sensibile ? 'Sì' : 'No'}</td>
                <td><Esito valore={voce.stato} /></td>
                <td style={{ textAlign: 'right' }}>
                  <Link to="/asset/nuovo">Modifica</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="azioni">
        <Link className="pulsante" to="/asset/nuovo">Aggiungi asset</Link>
        <span style={{ flex: 1 }} />
        <Link className="pulsante" to="/dispositivo/nuovo">Indietro</Link>
        <Link className="pulsante pulsante-primario" to="/dispositivo/riepilogo">Continua</Link>
      </div>
    </>
  )
}
