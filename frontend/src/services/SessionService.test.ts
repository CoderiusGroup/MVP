import { describe, expect, it } from "vitest";

import { Device } from "../domain/entities/Device";
import { Session } from "../domain/entities/Session";
import { parseSessionFile, toSessionFile } from "./SessionService";

const device = Device.create({
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
  ],
});

const session = Session.parse({
  id: "SES-1",
  savedAt: "2020-01-01T00:00:00Z",
  status: "in_progress",
  device: device.toJSON(),
  evaluations: [],
  current: { assetId: "AS-1", requirementId: "ACM-1", nodeId: "n1" },
});

describe("SessionService", () => {
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
