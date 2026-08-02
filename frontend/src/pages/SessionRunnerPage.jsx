import { Link } from 'react-router'
import Esito from '../components/Esito.jsx'
import { asset, nodoCorrente, percorso, requisiti } from '../datiEsempio.js'

// UC-22: nodo corrente del decision tree, risposta sì/no e percorso già svolto.
export default function SessionRunnerPage() {
  return (
    <>
      <h1>Valutazione in corso</h1>
      <p className="sottotitolo">Credenziali di accesso utente — requisito ACM-2</p>

      <div className="impaginato-sessione">
        <aside className="riquadro">
          <p className="etichetta">Avanzamento</p>
          <p className="avanzamento">
            Asset 2 di 3 · requisiti 1 di 4
            <span className="barra"><span style={{ width: '35%' }} /></span>
          </p>

          <p className="etichetta" style={{ marginTop: '1.2rem' }}>Asset</p>
          <ul className="elenco-laterale">
            {asset.map(voce => (
              <li key={voce.id}>
                <span className={voce.stato === 'in_corso' ? 'corrente' : undefined}>{voce.nome}</span>
                <Esito valore={voce.stato} />
              </li>
            ))}
          </ul>

          <p className="etichetta" style={{ marginTop: '1.2rem' }}>Requisiti dell&apos;asset</p>
          <ul className="elenco-laterale">
            {requisiti.map(requisito => (
              <li key={requisito.codice}>
                <span className={requisito.stato === 'in_corso' ? 'corrente' : undefined}>
                  {requisito.codice}
                </span>
                <Esito valore={requisito.stato} />
              </li>
            ))}
          </ul>
        </aside>

        <div>
          <div className="riquadro">
            <span className="codice-nodo">{nodoCorrente.codice}</span>
            <p className="domanda">{nodoCorrente.domanda}</p>

            <div className="azioni" style={{ marginTop: 0 }}>
              <button className="pulsante pulsante-primario pulsante-grande" type="button">Sì</button>
              <button className="pulsante pulsante-grande" type="button">No</button>
            </div>
          </div>

          <div className="riquadro">
            <h2>Percorso svolto</h2>
            <ul className="percorso">
              {percorso.map(passo => (
                <li key={passo.nodo}>
                  <span><span className="codice-nodo">{passo.nodo}</span> {passo.domanda}</span>
                  <span className="risposta">{passo.risposta}</span>
                </li>
              ))}
            </ul>
            <p className="nota" style={{ marginTop: '0.8rem' }}>
              Nella versione definitiva qui compare anche il grafo del decision tree con il nodo
              corrente evidenziato (UC-22.2).
            </p>
          </div>

          <div className="azioni">
            <Link className="pulsante" to="/sessione/modifica">Cambia requisito</Link>
            <span style={{ flex: 1 }} />
            <Link className="pulsante" to="/">Salva ed esci</Link>
            <Link className="pulsante" to="/risultati">Vedi risultati</Link>
          </div>
        </div>
      </div>
    </>
  )
}
