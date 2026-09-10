import type { Outcome } from "../domain/rules/treeRules";
import { STATUS_COLORS } from "../theme/statusColors";

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
        borderRadius: "999px",
        color: "#fff",
        fontWeight: 600,
        fontSize: "0.875rem",
        backgroundColor: STATUS_COLORS[outcome],
      }}
    >
      {LABELS[outcome]}
    </span>
  );
}
