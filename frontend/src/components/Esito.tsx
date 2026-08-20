import type { Outcome } from "../domain/rules/treeRules";

const COLORS: Record<Outcome, string> = {
  PASS: "#1a7f37",
  FAIL: "#cf222e",
  NOT_APPLICABLE: "#57606a",
};

const LABELS: Record<Outcome, string> = {
  PASS: "PASS",
  FAIL: "FAIL",
  NOT_APPLICABLE: "N/A",
};

type Props = {
  outcome: Outcome;
};

export function Esito({ outcome }: Props) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "4px",
        color: "#fff",
        fontWeight: 600,
        backgroundColor: COLORS[outcome],
      }}
    >
      {LABELS[outcome]}
    </span>
  );
}
