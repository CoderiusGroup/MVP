# Contratto API

Contratto vincolante tra backend e frontend. Qualsiasi modifica alla forma dei dati va
concordata aggiornando questo documento prima del codice.

La forma di `Device`, `Asset`, `DecisionTree` e `Session` segue la specifica di
importazione/esportazione JSON del progetto (schema `1.0`): stesso formato in lettura API,
in importazione da file e in esportazione. `Asset`/`Session` non hanno ancora un endpoint
REST proprio in questo branch, ma la forma è documentata qui perché condivisa dalle entità
di dominio già presenti nel codice (`backend/src/domain/`, `frontend/src/domain/entities/`).

Tutte le risposte sono `application/json`. Errori nel formato:

```json
{ "error": "messaggio descrittivo" }
```

## DecisionTree

### `GET /decision-trees/{requirementId}` — lettura decision tree

Un albero descrive **un solo requisito** EN 18031, identificato da `requirementId` (es.
`ACM-1`). I nodi sono in lista piatta; i collegamenti sono riferimenti espliciti
`branches.yes` / `branches.no` — non annidati, per permettere foglie condivise fra rami
diversi.

Risposta `200`:

```json
{
  "requirementId": "ACM-1",
  "requirementName": "Applicable access control mechanisms",
  "version": "1.0.0",
  "appliesTo": ["network", "security"],
  "rootNode": "N1",
  "nodes": [
    {
      "id": "N1",
      "type": "question",
      "text": "Il dispositivo espone asset di rete o di sicurezza che richiedono controllo degli accessi?",
      "branches": { "yes": "N2", "no": "L-NA" }
    },
    {
      "id": "L-NA",
      "type": "leaf",
      "outcome": "NOT_APPLICABLE",
      "text": "Il dispositivo non espone asset che richiedono un controllo degli accessi."
    }
  ]
}
```

| Campo | Obbl. | Note |
|---|---|---|
| `requirementId` | sì | `^[A-Z]{2,4}-[0-9]+(\.[0-9]+)?$`, es. `ACM-1` |
| `requirementName` | sì | nome esteso del requisito |
| `version` | no | versione della definizione dell'albero |
| `appliesTo` | no | tipi di asset per cui il requisito è applicabile |
| `dependencies` | no | requisiti da cui dipende |
| `rootNode` | sì | codice del nodo radice, presente in `nodes` |
| `nodes[].type: "question"` | | `id`, `text`, `branches.yes`, `branches.no` (albero binario) |
| `nodes[].type: "leaf"` | | `id`, `outcome` (`PASS`\|`FAIL`\|`NOT_APPLICABLE`), `text` facoltativo |

Errori:
- `404` — nessun decision tree con quel `requirementId`

### `POST /decision-trees/import` — importazione decision tree

Richiesta `multipart/form-data` con un campo `file` in formato JSON o CSV. Il JSON può
essere un file esportato dall'endpoint oppure un file nel formato con envelope
`decisionTree` usato dai dati iniziali. Il CSV deve usare le colonne generate
dall'esportazione del decision tree.

Il sistema valida la struttura dell'albero, lo salva e restituisce il decision tree
normalizzato nel formato della risposta `GET /decision-trees/{requirementId}`.

Risposta `201`: decision tree importato.

Errori:
- `400` — file mancante, formato non supportato o struttura del decision tree non valida

### `DELETE /decision-trees/{requirementId}` — eliminazione decision tree

Rimuove definitivamente il decision tree. Nessun vincolo referenziale: l'eliminazione è
sempre permessa (il backend è stateless per device e sessioni).

Risposta `204`: nessun contenuto.

Errori:
- `404` — nessun decision tree con quel `requirementId`

## Device

### `POST /devices` — creazione device (stateless)

Richiesta:

```json
{
  "name": "Smart Lock SL-200",
  "operatingSystem": "Zephyr RTOS 3.5",
  "description": "Serratura elettronica connessa tramite Wi-Fi e BLE."
}
```

| Campo | Obbl. | Note |
|---|---|---|
| `name` | sì | 1–100 caratteri |
| `operatingSystem` | sì | 1–100 caratteri |
| `description` | sì | 1–1000 caratteri |
| `id` | no | se fornito viene rispettato (caso importazione); se assente il sistema lo genera |

Risposta `201`:

```json
{
  "id": "b16c57f8-c58b-488e-b017-4505a4f206c0",
  "name": "Smart Lock SL-200",
  "operatingSystem": "Zephyr RTOS 3.5",
  "description": "Serratura elettronica connessa tramite Wi-Fi e BLE.",
  "assets": []
}
```

`assets` è sempre `[]` in risposta: la creazione device (UC-4.1.1–4.1.3) non include gli
asset, che sono un passo separato (UC-12, vedi `POST /assets` più sotto).

Errori:
- `400` — corpo non valido, oppure `name`/`operatingSystem`/`description` mancante o vuoto

**Nessun `GET /devices/{id}`, di proposito.** L'endpoint è stateless: il backend non
persiste il device da nessuna parte (nessun file, nessuno storage, nessuna collezione
richiamabile). Esiste un solo dispositivo alla volta, lato client. L'unico caso in cui un
device viene salvato è incorporato in una sessione di valutazione (`Session.device`, vedi
sotto), ed è un file scaricato dall'utente — non uno stato sul server. Per questo non c'è
nulla da recuperare per id.

### Forma completa (con asset, usata dentro `Session`)

`Device` accetta anche una lista di `Asset` popolata — è la forma usata quando il device
viaggia dentro una sessione di valutazione, non quella restituita da `POST /devices`:

```json
{
  "id": "DEV-SL200",
  "name": "Smart Lock SL-200",
  "operatingSystem": "Zephyr RTOS 3.5",
  "description": "Serratura elettronica connessa tramite Wi-Fi e BLE.",
  "assets": [
    {
      "id": "AS-02",
      "name": "Credenziali di accesso utente",
      "type": "security",
      "description": "Codici PIN e token memorizzati sul dispositivo.",
      "sensitive": true,
      "requirements": ["ACM-1", "ACM-2"]
    }
  ]
}
```

| Campo | Obbl. | Note |
|---|---|---|
| `device.assets` | sì | lista, può essere vuota |
| `assets[].id` | sì* | univoco nel device (\*generato se assente in importazione) |
| `assets[].name` | sì | 1–100 caratteri |
| `assets[].type` | sì | `network` \| `security` \| `privacy` \| `financial` |
| `assets[].description` | sì | 1–1000 caratteri |
| `assets[].sensitive` | sì | booleano |
| `assets[].requirements` | no | se assente, derivati dal tipo asset tramite `appliesTo` del decision tree |

## Asset

### `POST /assets` — creazione asset (stateless)

Come `POST /devices`: nessuna persistenza server-side, nessuna associazione al device
lato backend. Il client è responsabile di aggiungere l'asset restituito alla lista `assets`
del device che gestisce in memoria (vedi UC-12).

**Nessun campo `state`/`stato`, di proposito.** La Specifica Tecnica lo prevede
(`non_valutato | in_corso | PASS | FAIL | NOT_APPLICABLE`), ma è uno stato di
valutazione derivato dalle `Evaluation` di una `Session` (vedi sotto) per coppia
asset+requirement — un asset appena creato non ha ancora nessuna valutazione a cui
agganciarlo. Il campo arriverà come proprietà calcolata quando `Session`/`Result`
saranno implementati, non come campo statico di questo endpoint.

Richiesta:

```json
{
  "name": "Credenziali di accesso utente",
  "type": "security",
  "description": "Codici PIN e token memorizzati sul dispositivo.",
  "sensitive": true
}
```

| Campo | Obbl. | Note |
|---|---|---|
| `name` | sì | 1–100 caratteri |
| `type` | sì | `network` \| `security` \| `privacy` \| `financial` |
| `description` | sì | 1–1000 caratteri |
| `sensitive` | sì | booleano |
| `requirements` | no | se **assente** (chiave non presente o `null`), derivato dal `type` tramite `appliesTo` dei decision tree disponibili; se presente (anche `[]`), rispettato così com'è |
| `id` | no | se fornito viene rispettato (caso importazione); se assente il sistema lo genera |

Risposta `201`:

```json
{
  "id": "b16c57f8-c58b-488e-b017-4505a4f206c0",
  "name": "Credenziali di accesso utente",
  "type": "security",
  "description": "Codici PIN e token memorizzati sul dispositivo.",
  "sensitive": true,
  "requirements": ["ACM-1", "ACM-2"]
}
```

Errori:
- `400` — corpo non valido, oppure `name`/`type`/`description`/`sensitive` mancante,
  vuoto o di tipo errato; `type` fuori dai valori ammessi

### Riuso per la modifica di un asset (UC-16)

Non esiste un `PUT`/`PATCH /assets/{id}` dedicato. La modifica di un asset esistente è
gestita interamente lato client (nessuna chiamata) **tranne quando cambia `type`**: in
quel caso il frontend chiama di nuovo `POST /assets`, passando l'`id` dell'asset esistente
e **omettendo** `requirements`, così il backend lo ri-deriva dal nuovo `type` con la stessa
logica della creazione. Nessuna modifica al backend è stata necessaria: `create_asset`
accetta già un `id` fornito dal client e lo rispetta invece di generarne uno nuovo.

## Session (forma dati, endpoint non ancora implementato)

Autoconsistente per dispositivo, asset, esiti e percorsi; i decision tree non sono
inclusi, sono referenziati per `requirementId`.

```json
{
  "id": "SES-20260728-1105",
  "savedAt": "2026-07-28T11:05:00Z",
  "status": "in_progress",
  "device": { "id": "DEV-SL200", "name": "...", "operatingSystem": "...", "description": "...", "assets": [] },
  "decisionTreeVersions": { "ACM-1": "1.0.0" },
  "current": { "assetId": "AS-02", "requirementId": "ACM-2", "nodeId": "M2" },
  "evaluations": [
    {
      "assetId": "AS-02",
      "requirementId": "ACM-1",
      "status": "completed",
      "outcome": "PASS",
      "justification": "Il PIN utente è richiesto a ogni apertura.",
      "path": [
        { "nodeId": "N1", "answer": "yes" },
        { "nodeId": "N2", "answer": "yes" }
      ]
    }
  ]
}
```

Note:
- `current` obbligatorio se `status: "in_progress"`, assente se `status: "completed"`.
- `path` registra le risposte (`yes`/`no`), non i nodi attraversati: il nodo raggiunto è
  sempre ricalcolabile percorrendo l'albero.
- una valutazione `completed` richiede `outcome` e `path`; una `not_evaluated` non ha né
  l'uno né l'altro.
