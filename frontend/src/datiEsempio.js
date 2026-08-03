// Dati statici usati solo per riempire la bozza: nessuna chiamata al backend.
// I valori seguono i formati definiti in samples/ImportazioneJSON della documentazione.

export const dispositivo = {
  nome: 'Smart Lock SL-200',
  sistemaOperativo: 'Zephyr RTOS 3.5',
  descrizione: 'Serratura elettronica connessa tramite Wi-Fi e BLE.',
}

export const tipiAsset = ['network', 'security', 'privacy', 'financial']

export const asset = [
  { id: 'AS-01', nome: 'Interfaccia Wi-Fi', tipo: 'network', sensibile: false, stato: 'PASS' },
  { id: 'AS-02', nome: 'Credenziali di accesso utente', tipo: 'security', sensibile: true, stato: 'in_corso' },
  { id: 'AS-03', nome: 'Registro degli accessi', tipo: 'privacy', sensibile: true, stato: 'non_valutato' },
]

export const requisiti = [
  { codice: 'ACM-1', nome: 'Applicable access control mechanisms', stato: 'PASS' },
  { codice: 'ACM-2', nome: 'Appropriate access control mechanisms', stato: 'in_corso' },
  { codice: 'AUM-1', nome: 'Applicable authentication mechanisms', stato: 'non_valutato' },
  { codice: 'AUM-5', nome: 'Password strength', stato: 'non_valutato' },
]

export const nodoCorrente = {
  codice: 'N2',
  domanda: 'Il controllo degli accessi distingue fra ruoli diversi, per esempio utente e amministratore?',
}

export const percorso = [
  { nodo: 'N1', domanda: 'Il dispositivo espone asset che richiedono controllo degli accessi?', risposta: 'Sì' },
]

export const risultati = [
  {
    asset: 'Interfaccia Wi-Fi',
    tipo: 'network',
    esito: 'PASS',
    requisiti: [
      { codice: 'ACM-1', esito: 'PASS' },
      { codice: 'AUM-1', esito: 'NOT_APPLICABLE' },
    ],
  },
  {
    asset: 'Credenziali di accesso utente',
    tipo: 'security',
    esito: 'FAIL',
    requisiti: [
      { codice: 'ACM-1', esito: 'PASS' },
      { codice: 'ACM-2', esito: 'FAIL' },
      { codice: 'AUM-5', esito: 'PASS' },
    ],
  },
]

// UC-29.1: per ogni albero servono codice e nome del requisito associato.
export const catalogoDecisionTree = [
  { requisito: 'ACM-1', nome: 'Applicable access control mechanisms', nodi: 7, dipendenze: [] },
  { requisito: 'ACM-2', nome: 'Appropriate access control mechanisms', nodi: 9, dipendenze: ['ACM-1'] },
  { requisito: 'AUM-1', nome: 'Applicable authentication mechanisms', nodi: 5, dipendenze: [] },
  { requisito: 'AUM-5', nome: 'Password strength', nodi: 11, dipendenze: ['AUM-1'] },
  { requisito: 'SUM-1', nome: 'Secure update mechanisms', nodi: 8, dipendenze: [] },
]

// Albero di ACM-1 in forma piatta, come il formato di importazione:
// nodi con domanda più rami sì/no, nodi foglia con esito.
export const alberoAcm1 = {
  requisito: 'ACM-1',
  nome: 'Applicable access control mechanisms',
  versione: '1.0.0',
  applicabileA: ['network', 'security'],
  dipendenze: [],
  radice: 'N1',
  nodi: [
    {
      id: 'N1',
      tipo: 'domanda',
      testo: 'Il dispositivo implementa un meccanismo di controllo degli accessi per le sue funzionalità?',
      rami: { sì: 'N2', no: 'L-FAIL-1' },
    },
    {
      id: 'N2',
      tipo: 'domanda',
      testo: 'Il controllo degli accessi distingue fra ruoli diversi, per esempio utente e amministratore?',
      rami: { sì: 'N3', no: 'L-FAIL-2' },
    },
    {
      id: 'N3',
      tipo: 'domanda',
      testo: 'I permessi di accesso seguono il principio del privilegio minimo?',
      rami: { sì: 'L-PASS', no: 'L-FAIL-3' },
    },
    {
      id: 'L-PASS',
      tipo: 'foglia',
      esito: 'PASS',
      testo: 'Il meccanismo di controllo degli accessi è implementato correttamente.',
    },
    {
      id: 'L-FAIL-1',
      tipo: 'foglia',
      esito: 'FAIL',
      testo: 'Il dispositivo non implementa alcun meccanismo di controllo degli accessi.',
    },
    {
      id: 'L-FAIL-2',
      tipo: 'foglia',
      esito: 'FAIL',
      testo: 'Il controllo degli accessi non distingue fra ruoli: tutti gli utenti hanno gli stessi permessi.',
    },
    {
      id: 'L-FAIL-3',
      tipo: 'foglia',
      esito: 'FAIL',
      testo: 'I permessi non seguono il principio del privilegio minimo.',
    },
  ],
}
