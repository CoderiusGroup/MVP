// Etichetta colorata per gli stati di valutazione previsti da UC-20.2.1.
const stili = {
  PASS: ['esito-pass', 'PASS'],
  FAIL: ['esito-fail', 'FAIL'],
  NOT_APPLICABLE: ['esito-na', 'NOT APPLICABLE'],
  in_corso: ['esito-corso', 'In corso'],
  non_valutato: ['esito-attesa', 'Non valutato'],
}

export default function Esito({ valore }) {
  const [classe, testo] = stili[valore] ?? stili.non_valutato
  return <span className={`esito ${classe}`}>{testo}</span>
}
