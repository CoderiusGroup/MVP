import { Link } from 'react-router'
import Esito from '../components/Esito.jsx'
import GrafoDecisionTree from '../components/GrafoDecisionTree.jsx'
import { alberoAcm1 } from '../datiEsempio.js'

// UC-30: codice e nome del requisito, grafo (UC-30.1) e dipendenze (UC-30.2).
export default function DecisionTreeDetailPage() {
  const domande = alberoAcm1.nodi.filter(nodo => nodo.tipo === 'domanda')
  const foglie = alberoAcm1.nodi.filter(nodo => nodo.tipo === 'foglia')

  return (
    <>
      <h1>{alberoAcm1.requisito} — {alberoAcm1.nome}</h1>
      <p className="sottotitolo">
        Versione {alberoAcm1.versione} · nodo radice {alberoAcm1.radice} ·
        applicabile ad asset di tipo {alberoAcm1.applicabileA.join(' e ')}
      </p>

      <div className="riquadro">
        <h2>Dipendenze</h2>
        {alberoAcm1.dipendenze.length > 0 ? (
          <p>{alberoAcm1.dipendenze.join(', ')}</p>
        ) : (
          <p className="nota">Il requisito non dipende da altri requisiti.</p>
        )}
      </div>

      <div className="riquadro">
        <h2>Grafo</h2>
        <GrafoDecisionTree />
        <p className="nota">
          Disegno statico: nella versione definitiva il layout va calcolato dai nodi, e per
          questo serve una libreria di grafi che la Specifica Tecnica non indica ancora.
        </p>
      </div>

      <div className="riquadro">
        <h2>Nodi con domanda</h2>
        <table style={{ marginTop: '0.6rem' }}>
          <thead>
            <tr>
              <th>Codice</th>
              <th>Domanda</th>
              <th>Sì</th>
              <th>No</th>
            </tr>
          </thead>
          <tbody>
            {domande.map(nodo => (
              <tr key={nodo.id}>
                <td><span className="codice-nodo">{nodo.id}</span></td>
                <td>{nodo.testo}</td>
                <td><span className="codice-nodo">{nodo.rami.sì}</span></td>
                <td><span className="codice-nodo">{nodo.rami.no}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="riquadro">
        <h2>Nodi foglia</h2>
        <table style={{ marginTop: '0.6rem' }}>
          <thead>
            <tr>
              <th>Codice</th>
              <th>Esito</th>
              <th>Motivazione</th>
            </tr>
          </thead>
          <tbody>
            {foglie.map(nodo => (
              <tr key={nodo.id}>
                <td><span className="codice-nodo">{nodo.id}</span></td>
                <td><Esito valore={nodo.esito} /></td>
                <td>{nodo.testo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="azioni">
        <Link className="pulsante" to="/decision-tree">Torna all&apos;elenco</Link>
        <span style={{ flex: 1 }} />
        <button className="pulsante" type="button">Esporta JSON</button>
        <button className="pulsante" type="button">Esporta CSV</button>
      </div>
    </>
  )
}
