# Contratto API

Contratto vincolante tra backend e frontend. Qualsiasi modifica alla forma dei dati va
concordata aggiornando questo documento prima del codice.

La forma di `Device`, `Asset`, `DecisionTree` e `Session` segue la specifica di
importazione/esportazione JSON del progetto (schema `1.0`): stesso formato in lettura API,
in importazione da file e in esportazione. `Device`/`Asset`/`Session` non hanno ancora un
endpoint REST proprio in questo branch — solo `DecisionTree` è esposto — ma la forma è
documentata qui perché condivisa dalle entità di dominio già presenti nel codice
(`backend/src/domain/`, `frontend/src/domain/entities/`).

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

## Device (forma dati, endpoint non ancora implementato)

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
| `device.id` | sì* | identificativo univoco (\*generato dal sistema se assente in importazione) |
| `device.name` | sì | 1–100 caratteri |
| `device.operatingSystem` | sì | 1–100 caratteri |
| `device.description` | sì | 1–1000 caratteri |
| `device.assets` | sì | lista, può essere vuota |
| `assets[].id` | sì* | univoco nel device (\*generato se assente in importazione) |
| `assets[].name` | sì | 1–100 caratteri |
| `assets[].type` | sì | `network` \| `security` \| `privacy` \| `financial` |
| `assets[].description` | sì | 1–1000 caratteri |
| `assets[].sensitive` | sì | booleano |
| `assets[].requirements` | no | se assente, derivati dal tipo asset tramite `appliesTo` del decision tree |

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
