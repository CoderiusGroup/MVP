import { Link } from 'react-router'
import { catalogoDecisionTree } from '../datiEsempio.js'

// UC-29: elenco ordinato dei decision tree, con codice e nome del requisito (UC-29.1).
export default function DecisionTreeListPage() {
  return (
    <>
      <h1>Decision tree</h1>
      <p className="sottotitolo">
        {catalogoDecisionTree.length} alberi disponibili, uno per requisito EN 18031.
      </p>

      <div className="riquadro">
        <table>
          <thead>
            <tr>
              <th>Requisito</th>
              <th>Nome</th>
              <th>Nodi</th>
              <th>Dipendenze</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {catalogoDecisionTree.map(albero => (
              <tr key={albero.requisito}>
                <td><strong>{albero.requisito}</strong></td>
                <td>{albero.nome}</td>
                <td>{albero.nodi}</td>
                <td>
                  {albero.dipendenze.length > 0
                    ? albero.dipendenze.join(', ')
                    : <span className="nota">nessuna</span>}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Link to="/decision-tree/dettaglio">Apri</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="azioni">
        <Link className="pulsante" to="/decision-tree/dettaglio">Importa decision tree</Link>
      </div>
    </>
  )
}
