# Guida ai contributi

## Convenzione branch

Solo tre prefissi ammessi:

- `feature/<nome-feature>` — nuove funzionalità. Raggruppa gli UC correlati sotto un'unica
  feature invece di un branch per ogni singolo UC (es. `feature/device-creazione-gestione`,
  non un branch a UC). Include anche setup/configurazione (es.
  `feature/setup-scaffold-iniziale`).
- `fix/<descrizione>` — correzioni.
- `hotfix/<descrizione>` — riservato a bugfix urgenti su `main`.

Non si lavora mai direttamente su `develop` o `main`.

## Convenzione commit

Messaggio breve, all'imperativo, con riferimento a UC/RF quando pertinente.

## Checklist prima di aprire una PR

- Lint pulito (`ruff check .` / `npm run lint`)
- Test passanti in locale (`pytest` / `npm run test:coverage`)
- Contratto API (`docs/api-contract.md`) rispettato per eventuali modifiche alla forma
  di Device, Asset o DecisionTree — in caso di modifica, aggiornare prima il contratto

Le PR vanno aperte verso `develop`, mai verso `main`, compilando il template esistente,
con approvazione di un altro membro del team prima del merge.
