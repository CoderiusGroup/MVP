import type { DisplayStatus } from "../domain/rules/sessionRules";

// Sorgente unica dei colori di esito. Usata da Esito.tsx, GrafoDecisionTree.tsx e
// ReportDocument.tsx (@react-pdf/renderer non legge le CSS custom properties).
// Tenere in sync con i token --color-pass/--color-fail/--color-na/--color-progress
// in src/styles/tokens.css.
export const STATUS_COLORS: Record<DisplayStatus, string> = {
  PASS: "#1a7f37",
  FAIL: "#cf222e",
  NOT_APPLICABLE: "#57606a",
  in_progress: "#9a6700",
  not_evaluated: "#57606a",
  no_requirements: "#57606a",
};
