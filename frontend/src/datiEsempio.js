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
