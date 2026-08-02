import { Link } from 'react-router'
import Esito from '../components/Esito.jsx'
import { asset, dispositivo } from '../datiEsempio.js'

// UC-7 e UC-19: riepilogo dei dati prima di avviare la sessione di valutazione.
export default function DeviceSummaryPage() {
  return (
    <>
      <h1>Riepilogo</h1>
      <p className="sottotitolo">Controlla i dati prima di avviare la valutazione.</p>

      <div className="riquadro">
        <h2>Dispositivo</h2>
        <div className="griglia griglia-2" style={{ marginTop: '0.8rem' }}>
          <div>
            <p className="etichetta">Nome</p>
            <p>{dispositivo.nome}</p>
          </div>
          <div>
            <p className="etichetta">Sistema operativo</p>
            <p>{dispositivo.sistemaOperativo}</p>
          </div>
        </div>
        <div style={{ marginTop: '0.9rem' }}>
          <p className="etichetta">Descrizione</p>
          <p>{dispositivo.descrizione}</p>
        </div>
      </div>

      <div className="riquadro">
        <h2>Asset</h2>
        <table style={{ marginTop: '0.6rem' }}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Sensibile</th>
              <th>Stato</th>
            </tr>
          </thead>
          <tbody>
            {asset.map(voce => (
              <tr key={voce.id}>
                <td>{voce.nome}</td>
                <td>{voce.tipo}</td>
                <td>{voce.sensibile ? 'Sì' : 'No'}</td>
                <td><Esito valore={voce.stato} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="azioni azioni-fine">
        <Link className="pulsante" to="/dispositivo/asset">Modifica asset</Link>
        <Link className="pulsante pulsante-primario pulsante-grande" to="/sessione">
          Avvia valutazione
        </Link>
      </div>
    </>
  )
}
