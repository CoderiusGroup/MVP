// Segnaposto statico per RF-Ob69: coordinate scritte a mano per l'albero di ACM-1.
// Nel prodotto vero il layout va calcolato a partire dai nodi, quindi serve una
// libreria di disegno di grafi: la Specifica Tecnica non ne indica ancora una.

const NODI = [
  { id: 'N1', tipo: 'domanda', cx: 330, cy: 36, w: 90 },
  { id: 'N2', tipo: 'domanda', cx: 210, cy: 126, w: 90 },
  { id: 'N3', tipo: 'domanda', cx: 130, cy: 216, w: 90 },
  { id: 'FAIL', tipo: 'fail', cx: 520, cy: 126, w: 130 },
  { id: 'FAIL', tipo: 'fail', cx: 350, cy: 216, w: 130 },
  { id: 'PASS', tipo: 'pass', cx: 80, cy: 306, w: 130 },
  { id: 'FAIL', tipo: 'fail', cx: 250, cy: 306, w: 130 },
]

const ARCHI = [
  { da: [330, 54], a: [210, 108], etichetta: 'sì' },
  { da: [330, 54], a: [520, 108], etichetta: 'no' },
  { da: [210, 144], a: [130, 198], etichetta: 'sì' },
  { da: [210, 144], a: [350, 198], etichetta: 'no' },
  { da: [130, 234], a: [80, 288], etichetta: 'sì' },
  { da: [130, 234], a: [250, 288], etichetta: 'no' },
]

const ALTEZZA = 36

export default function GrafoDecisionTree() {
  return (
    <svg className="grafo" viewBox="0 0 660 350" role="img" aria-label="Grafo del decision tree ACM-1">
      {ARCHI.map((arco, indice) => (
        <g key={indice}>
          <line x1={arco.da[0]} y1={arco.da[1]} x2={arco.a[0]} y2={arco.a[1]} className="grafo-arco" />
          <text
            x={(arco.da[0] + arco.a[0]) / 2 + 8}
            y={(arco.da[1] + arco.a[1]) / 2}
            className="grafo-etichetta"
          >
            {arco.etichetta}
          </text>
        </g>
      ))}

      {NODI.map((nodo, indice) => (
        <g key={indice}>
          <rect
            x={nodo.cx - nodo.w / 2}
            y={nodo.cy - ALTEZZA / 2}
            width={nodo.w}
            height={ALTEZZA}
            rx="6"
            className={`grafo-nodo grafo-nodo-${nodo.tipo}`}
          />
          <text x={nodo.cx} y={nodo.cy + 5} className="grafo-testo">
            {nodo.id}
          </text>
        </g>
      ))}
    </svg>
  )
}
