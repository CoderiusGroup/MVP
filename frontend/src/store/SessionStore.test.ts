import { beforeEach, describe, expect, it } from "vitest";

import type { Device } from "../domain/entities/Device";
import { useSessionStore } from "./SessionStore";

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

beforeEach(() => {
  useSessionStore.getState().reset();
});

describe("SessionStore", () => {
  it("builds one evaluation per (asset, requirement) pair and points to the first", () => {
    useSessionStore.getState().start(device);
    const session = useSessionStore.getState().session!;

    expect(session.status).toBe("in_progress");
    expect(session.evaluations).toHaveLength(3);
    expect(session.evaluations.every((e) => e.status === "not_evaluated")).toBe(true);
    expect(session.current).toMatchObject({ assetId: "AS-1", requirementId: "ACM-1" });
  });

  it("syncProgress updates the current node and the current evaluation path", () => {
    useSessionStore.getState().start(device);
    useSessionStore.getState().syncProgress("n2", [{ nodeId: "n1", answer: "yes" }]);

    const session = useSessionStore.getState().session!;
    expect(session.current!.nodeId).toBe("n2");
    const first = session.evaluations[0];
    expect(first.status).toBe("in_progress");
    expect(first.path).toEqual([{ nodeId: "n1", answer: "yes" }]);
  });

  it("completeCurrent records the outcome on the current pair without completing the session", () => {
    useSessionStore.getState().start(device);
    useSessionStore.getState().completeCurrent("PASS", [{ nodeId: "n1", answer: "yes" }]);

    const session = useSessionStore.getState().session!;
    expect(session.evaluations[0]).toMatchObject({ status: "completed", outcome: "PASS" });
    expect(session.status).toBe("in_progress");
  });

  it("completes the session once every pair is evaluated", () => {
    useSessionStore.getState().start(device);
    const pairs = useSessionStore
      .getState()
      .session!.evaluations.map((e) => ({ assetId: e.assetId, requirementId: e.requirementId }));
    for (const pair of pairs) {
      useSessionStore.getState().select(pair.assetId, pair.requirementId);
      useSessionStore.getState().completeCurrent("PASS", []);
    }

    const session = useSessionStore.getState().session!;
    expect(session.status).toBe("completed");
    expect(session.evaluations.every((e) => e.status === "completed")).toBe(true);
  });

  it("starts already completed when the device has no assets to evaluate", () => {
    useSessionStore.getState().start({ ...device, assets: [] });
    const session = useSessionStore.getState().session!;

    expect(session.status).toBe("completed");
    expect(session.current).toBeUndefined();
    expect(session.evaluations).toHaveLength(0);
  });

  it("select jumps current to the chosen pair without altering evaluations", () => {
    useSessionStore.getState().start(device);
    useSessionStore.getState().completeCurrent("PASS", []);
    const before = useSessionStore.getState().session!.evaluations;

    useSessionStore.getState().select("AS-2", "AUM-1-1");

    const session = useSessionStore.getState().session!;
    expect(session.current).toMatchObject({ assetId: "AS-2", requirementId: "AUM-1-1" });
    expect(session.status).toBe("in_progress");
    expect(session.evaluations).toEqual(before);
  });

  it("reopen resets the chosen requirement and the given dependents, per asset", () => {
    useSessionStore.getState().start(device);
    const pairs = useSessionStore
      .getState()
      .session!.evaluations.map((e) => ({ assetId: e.assetId, requirementId: e.requirementId }));
    for (const pair of pairs) {
      useSessionStore.getState().select(pair.assetId, pair.requirementId);
      useSessionStore.getState().completeCurrent("PASS", []);
    }

    useSessionStore.getState().reopen("AS-1", "ACM-1", ["ACM-2"]);

    const session = useSessionStore.getState().session!;
    const find = (assetId: string, requirementId: string) =>
      session.evaluations.find((e) => e.assetId === assetId && e.requirementId === requirementId);
    expect(find("AS-1", "ACM-1")).toMatchObject({ status: "not_evaluated" });
    expect(find("AS-1", "ACM-2")).toMatchObject({ status: "not_evaluated" });
    expect(find("AS-2", "AUM-1-1")).toMatchObject({ status: "completed" });
    expect(session.status).toBe("in_progress");
    expect(session.current).toMatchObject({ assetId: "AS-1", requirementId: "ACM-1" });
  });

  it("ensureSession crea una sessione quando non ce n'è una", () => {
    useSessionStore.getState().ensureSession(device);

    const session = useSessionStore.getState().session!;
    expect(session.status).toBe("in_progress");
    expect(session.evaluations).toHaveLength(3);
    expect(session.device.id).toBe("DEV-1");
  });

  it("ensureSession riprende la sessione dello stesso device con lo stesso piano", () => {
    useSessionStore.getState().start(device);
    useSessionStore.getState().completeCurrent("PASS", []);

    useSessionStore.getState().ensureSession(device);

    const session = useSessionStore.getState().session!;
    const acm1 = session.evaluations.find(
      (e) => e.assetId === "AS-1" && e.requirementId === "ACM-1",
    );
    expect(acm1).toMatchObject({ status: "completed", outcome: "PASS" });
  });

  it("ensureSession riparte quando il piano del device è cambiato", () => {
    useSessionStore.getState().start(device);
    useSessionStore.getState().completeCurrent("PASS", []);

    const changed = {
      ...device,
      assets: device.assets.map((asset) =>
        asset.id === "AS-1" ? { ...asset, requirements: ["ACM-1"] } : asset,
      ),
    };
    useSessionStore.getState().ensureSession(changed);

    const session = useSessionStore.getState().session!;
    expect(session.evaluations).toHaveLength(2);
    expect(session.evaluations.every((e) => e.status === "not_evaluated")).toBe(true);
  });

  it("ensureSession crea una sessione nuova se il device è diverso", () => {
    useSessionStore.getState().start(device);
    useSessionStore.getState().completeCurrent("PASS", []);

    useSessionStore.getState().ensureSession({ ...device, id: "DEV-2" });

    const session = useSessionStore.getState().session!;
    expect(session.device.id).toBe("DEV-2");
    expect(session.evaluations.every((e) => e.status === "not_evaluated")).toBe(true);
  });
});
