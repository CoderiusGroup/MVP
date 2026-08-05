# Contratto API

Contratto vincolante tra backend e frontend. Qualsiasi modifica alla forma dei dati va
concordata aggiornando questo documento prima del codice.

Tutte le risposte sono `application/json`. Errori nel formato:

```json
{ "error": "messaggio descrittivo" }
```

## Device

### `POST /devices` — creazione device

Richiesta:

```json
{
  "name": "Router domestico XR500"
}
```

Risposta `201`:

```json
{
  "id": "d1",
  "name": "Router domestico XR500",
  "assets": []
}
```

Errori:
- `400` — corpo non valido (campo `name` mancante o vuoto)

### `GET /devices/{id}` — lettura device

Risposta `200`:

```json
{
  "id": "d1",
  "name": "Router domestico XR500",
  "assets": [
    { "id": "a1", "deviceId": "d1", "name": "Interfaccia web di gestione" }
  ]
}
```

Errori:
- `404` — device non trovato

## Asset

### `POST /devices/{deviceId}/assets` — creazione asset

Richiesta:

```json
{
  "name": "Interfaccia web di gestione"
}
```

Risposta `201`:

```json
{
  "id": "a1",
  "deviceId": "d1",
  "name": "Interfaccia web di gestione"
}
```

Errori:
- `400` — corpo non valido
- `404` — device non trovato

## DecisionTree

### `GET /decision-trees/{id}` — lettura decision tree

Risposta `200`:

```json
{
  "id": "t1",
  "name": "EN 18031 — Autenticazione",
  "rootNodeId": "n1",
  "nodes": [
    {
      "kind": "question",
      "id": "n1",
      "text": "Il dispositivo espone un'interfaccia di rete?",
      "onYes": "n2",
      "onNo": "n3"
    },
    { "kind": "leaf", "id": "n2", "result": "PASS" },
    { "kind": "leaf", "id": "n3", "result": "NOT_APPLICABLE" }
  ]
}
```

Errori:
- `404` — decision tree non trovato
