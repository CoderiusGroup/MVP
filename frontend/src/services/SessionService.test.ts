import { describe, expect, it } from "vitest";

import type { Device } from "../domain/entities/Device";
import type { Session } from "../domain/entities/Session";
import { buildPlan, parseSessionFile, toSessionFile } from "./SessionService";

const device: Device = {
  id: "DEV-1",
  name: "Device",
  operatingSystem: "OS",
  description: "desc",
  assets: [
    {
      id: "AS-1",
      name: "Asset 1",
      type: "network",
      description: "d",
      sensitive: false,
      requirements: ["ACM-1", "ACM-2"],
    },
    {
      id: "AS-2",
      name: "Asset 2",
      type: "security",
      description: "d",
      sensitive: true,
      requirements: ["AUM-1-1"],
    },
  ],
};

const session: Session = {
  id: "SES-1",
  savedAt: "2020-01-01T00:00:00Z",
  status: "in_progress",
  device,
  evaluations: [],
  current: { assetId: "AS-1", requirementId: "ACM-1", nodeId: "n1" },
};

describe("SessionService", () => {
  it("buildPlan enumerates assets then requirements in order", () => {
    expect(buildPlan(device)).toEqual([
      { assetId: "AS-1", requirementId: "ACM-1" },
      { assetId: "AS-1", requirementId: "ACM-2" },
      { assetId: "AS-2", requirementId: "AUM-1-1" },
    ]);
  });

  it("toSessionFile refreshes savedAt while keeping the rest intact", () => {
    const file = toSessionFile(session);
    expect(file.id).toBe("SES-1");
    expect(file.savedAt).not.toBe(session.savedAt);
    expect(new Date(file.savedAt).toString()).not.toBe("Invalid Date");
  });

  it("parseSessionFile validates and returns a Session", () => {
    const parsed = parseSessionFile(JSON.stringify(session));
    expect(parsed).toMatchObject({ id: "SES-1", status: "in_progress" });
  });

  it("parseSessionFile rejects malformed JSON", () => {
    expect(() => parseSessionFile("{not json")).toThrow(/JSON/);
  });

  it("parseSessionFile rejects a payload that is not a session", () => {
    expect(() => parseSessionFile(JSON.stringify({ foo: "bar" }))).toThrow(/sessione valida/);
  });
});
