# MVP — Gruppo Coderius

[![Coverage Status](https://coveralls.io/repos/github/CoderiusGroup/MVP/badge.svg?branch=develop)](https://coveralls.io/github/CoderiusGroup/MVP?branch=develop)

Repository ufficiale del codice del gruppo Coderius, nell'ambito del corso di Ingegneria del
Software — Università degli Studi di Padova (a.a. 2025/2026).

Il prodotto realizza il capitolato **C1 — Automated EN 18031 Compliance Verification**, proposto da
**Bluewind S.r.l.**: assiste un valutatore nella verifica di conformità di un dispositivo allo
standard EN 18031. Si descrivono il dispositivo e i suoi asset, si eseguono i decision tree dei
requisiti applicabili rispondendo a domande con esito affermativo o negativo, e si ottiene un report
degli esiti (`PASS`, `FAIL`, `NOT APPLICABLE`) esportabile in JSON e PDF.

## Documentazione

La documentazione di progetto è consultabile online al seguente indirizzo:
https://coderiusgroup.github.io/Documentazione/

I documenti da consultare prima di prendere decisioni su architettura, processo o convenzioni sono
l'[Analisi dei Requisiti][ar], la [Specifica Tecnica][st] e le [Norme di Progetto][np].

## Struttura della repository

```
MVP/
├── backend/             API REST in Flask (Python 3.12): logica di valutazione, validazione
│                        dei file JSON, persistenza su filesystem, generazione dei report
├── frontend/            Single Page Application React (Vite): interfaccia utente
├── docs/                contratto API e altra documentazione interna alla repository
├── .github/             workflow di integrazione continua e template delle pull request
├── docker-compose.yml   orchestrazione backend + frontend per l'ambiente locale
└── CONTRIBUTING.md      convenzioni di branch, commit e checklist per le pull request
```

## Tecnologie

| Ambito | Tecnologia | Versione |
|---|---|---|
| Backend | Python, Flask | 3.12, 3.1.3 |
| Frontend | TypeScript, React 19, Vite 8 | —, 19.2.7, 8.0.16 |
| Runtime frontend | Node.js | 22 |
| Librerie frontend | Zustand, Zod, TanStack Query, react-hot-toast | — |
| Test | pytest, ruff, Vitest, React Testing Library | — |
| Deployment | Docker, Docker Compose | 28.5.1, v2.40.0 |

Client e server comunicano esclusivamente via HTTP secondo lo stile REST, con scambio di dati in
JSON e senza stato di sessione conservato dal server.

## Membri del Gruppo

| Cognome Nome | Matricola |
|---|---|
| Bronte Giovanni Angelo Marco | 2041845 |
| Canavese Alberto | 2076423 |
| Hodja Edis | 2116422 |
| Iadadi Ines | 2113175 |
| Lorenzin Leonardo | 2116434 |
| Zonta Rocha Filippo | 1149339 |

## Contatti

Per informazioni o comunicazioni con il gruppo: 📧 coderius01@gmail.com

[ar]: https://coderiusgroup.github.io/Documentazione/docs/PB/Documenti/Esterni/Analisi_dei_Requisiti.pdf
[st]: https://coderiusgroup.github.io/Documentazione/docs/PB/Documenti/Esterni/Specifica_Tecnica.pdf
[np]: https://coderiusgroup.github.io/Documentazione/docs/RTB/Documenti/Interni/Norme_di_Progetto.pdf
