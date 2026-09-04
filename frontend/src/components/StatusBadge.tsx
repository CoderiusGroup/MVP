import { STATUS_LABELS, type DisplayStatus } from "../domain/rules/sessionRules";

const MODIFIER: Record<DisplayStatus, string> = {
  PASS: "pass",
  FAIL: "fail",
  NOT_APPLICABLE: "na",
  in_progress: "progress",
  not_evaluated: "neutral",
  no_requirements: "neutral",
};

type Props = {
  status: DisplayStatus;
};

export function StatusBadge({ status }: Props) {
  return (
    <span className={`status-badge status-badge--${MODIFIER[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
