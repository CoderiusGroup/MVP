import { Link } from 'react-router'

// UC-1, UC-2, UC-26: punto di ingresso verso inserimento, importazione e ripresa.
export default function HomePage() {
  return (
    <>
      <h1>Verifica di conformità EN 18031</h1>
      <p className="sottotitolo">
        Descrivi il dispositivo e i suoi asset, rispondi alle domande dei decision tree e ottieni
        l&apos;esito di conformità per ciascun requisito applicabile.
      </p>

      <div className="griglia griglia-3">
        <Link className="scheda-scelta" to="/dispositivo/nuovo">
          <h3>Nuovo dispositivo</h3>
          <p>Inserisci a mano i dati del dispositivo e i suoi asset.</p>
        </Link>

        <Link className="scheda-scelta" to="/dispositivo/riepilogo">
          <h3>Importa dispositivo</h3>
          <p>Carica un file JSON già pronto e passa direttamente al riepilogo.</p>
        </Link>

        <Link className="scheda-scelta" to="/sessione">
          <h3>Riprendi sessione</h3>
          <p>Continua una valutazione interrotta dal punto in cui era stata salvata.</p>
        </Link>
      </div>

      <div className="riquadro" style={{ marginTop: '1.6rem' }}>
        <p className="etichetta">Ultima sessione salvata</p>
        <p style={{ marginTop: '0.4rem' }}>
          Smart Lock SL-200 — 2 asset su 3 completati
        </p>
        <p className="nota">Salvata il 28/07/2026 alle 11:05</p>
      </div>
    </>
  )
}
