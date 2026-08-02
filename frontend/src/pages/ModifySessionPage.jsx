import { Link } from 'react-router'
import Esito from '../components/Esito.jsx'
import { asset, requisiti } from '../datiEsempio.js'

// UC-26: scelta della coppia asset-requisito da riprendere o da rifare.
export default function ModifySessionPage() {
  return (
    <>
      <h1>Modifica sessione</h1>
      <p className="sottotitolo">Scegli da dove riprendere la valutazione.</p>

      <div className="riquadro">
        <h2>Asset</h2>
        <table style={{ marginTop: '0.6rem' }}>
          <tbody>
            {asset.map(voce => (
              <tr key={voce.id}>
                <td>{voce.nome}</td>
                <td style={{ width: '9rem' }}><Esito valore={voce.stato} /></td>
                <td style={{ textAlign: 'right', width: '6rem' }}>
                  <Link to="/sessione">Seleziona</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="riquadro">
        <h2>Requisiti di &ldquo;Credenziali di accesso utente&rdquo;</h2>
        <table style={{ marginTop: '0.6rem' }}>
          <tbody>
            {requisiti.map(requisito => (
              <tr key={requisito.codice}>
                <td><strong>{requisito.codice}</strong> — {requisito.nome}</td>
                <td style={{ width: '9rem' }}><Esito valore={requisito.stato} /></td>
                <td style={{ textAlign: 'right', width: '6rem' }}>
                  <Link to="/sessione">{requisito.stato === 'PASS' ? 'Rifai' : 'Riprendi'}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="azioni azioni-fine">
        <Link className="pulsante" to="/sessione">Torna alla valutazione</Link>
        <Link className="pulsante" to="/risultati">Vedi risultati</Link>
      </div>
    </>
  )
}
