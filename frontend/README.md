# Frontend — bozza

Bozza **puramente estetica** dell'interfaccia: serve a discutere impaginazione, terminologia e
flusso fra le pagine. Non è ancora l'implementazione descritta dalla Specifica Tecnica.

Cosa c'è: le otto pagine previste dalla Specifica Tecnica, la navigazione fra loro con React Router,
e dati di esempio statici in `src/datiEsempio.js`.

Cosa non c'è: chiamate al backend, store Zustand, validazione Zod, TanStack Query, gestione degli
errori, test. I campi dei form non sono controllati e i pulsanti di azione non fanno nulla.

## Avvio

```
npm install
npm run dev
```

L'applicazione risponde su http://localhost:5173. La barra in alto elenca tutte le pagine, così si
possono guardare una per una senza percorrere l'intero flusso.

## Struttura

```
src/
├── App.jsx            rotte e intelaiatura comune
├── index.css          unico foglio di stile
├── datiEsempio.js     dati statici di riempimento
├── components/
│   └── Esito.jsx      etichetta PASS / FAIL / NOT APPLICABLE / In corso / Non valutato
└── pages/             una pagina per ciascun caso d'uso di ingresso
```
