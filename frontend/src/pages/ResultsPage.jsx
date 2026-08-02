import { Link } from 'react-router'
import Esito from '../components/Esito.jsx'
import { risultati } from '../datiEsempio.js'

// UC-27 e UC-28: esiti per asset e per requisito, con esportazione del report.
export default function ResultsPage() {
  return (
    <>
      <h1>Risultati della valutazione</h1>
      <p className="sottotitolo">Smart Lock SL-200 — valutazione completata</p>

      {risultati.map(voce => (
        <div className="riquadro" key={voce.asset}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ marginBottom: 0 }}>{voce.asset}</h2>
            <span className="nota">{voce.tipo}</span>
            <span style={{ flex: 1 }} />
            <Esito valore={voce.esito} />
          </div>

          <table style={{ marginTop: '0.9rem' }}>
            <tbody>
              {voce.requisiti.map(requisito => (
                <tr key={requisito.codice}>
                  <td>{requisito.codice}</td>
                  <td style={{ width: '11rem' }}><Esito valore={requisito.esito} /></td>
                  <td style={{ textAlign: 'right', width: '8rem' }}>
                    <Link to="/sessione">Vedi percorso</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="riquadro">
        <h2>Esporta report</h2>
        <div className="azioni" style={{ marginTop: '0.6rem' }}>
          <button className="pulsante" type="button">JSON</button>
          <button className="pulsante" type="button">PDF</button>
          <button className="pulsante" type="button">CSV</button>
        </div>
      </div>

      <div className="azioni azioni-fine">
        <Link className="pulsante" to="/sessione/modifica">Rivedi una valutazione</Link>
        <Link className="pulsante pulsante-primario" to="/">Nuova valutazione</Link>
      </div>
    </>
  )
}
