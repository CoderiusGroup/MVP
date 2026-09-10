import type { DisplayStatus } from "../domain/rules/sessionRules";

export const STATUS_COLORS: Record<DisplayStatus, string> = {
  PASS: "#1a7f37",
  FAIL: "#cf222e",
  NOT_APPLICABLE: "#57606a",
  in_progress: "#9a6700",
  not_evaluated: "#57606a",
  no_requirements: "#57606a",
};
