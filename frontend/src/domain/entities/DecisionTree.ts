import { z } from "zod";

import { createNode, NodeSchema, type Node } from "./Node";

const requirementCode = z.string().regex(/^[A-Z]{2,4}(-[A-Za-z0-9]+)+$/);

export const DecisionTreeSchema = z.object({
  requirementId: requirementCode,
  requirementName: z.string().min(1).max(200),
  version: z.string().regex(/^[0-9]+\.[0-9]+\.[0-9]+$/).optional(),
  appliesTo: z.array(z.enum(["network", "security", "privacy", "financial"])).optional(),
  dependencies: z.array(requirementCode).optional(),
  rootNode: z.string().min(1).max(32),
  nodes: z.array(NodeSchema),
  message: z.string().optional(),
});

export class DecisionTree {
  readonly #requirementId: string;
  readonly #requirementName: string;
  readonly #version: string | undefined;
  readonly #appliesTo: string[] | undefined;
  readonly #dependencies: string[] | undefined;
  readonly #rootNode: string;
  readonly #nodes: Node[];
  readonly #message: string | undefined;

  constructor(
    requirementId: string,
    requirementName: string,
    rootNode: string,
    nodes: Node[],
    options: {
      version?: string;
      appliesTo?: string[];
      dependencies?: string[];
      message?: string;
    } = {},
  ) {
    this.#requirementId = requirementId;
    this.#requirementName = requirementName;
    this.#rootNode = rootNode;
    this.#nodes = nodes;
    this.#version = options.version;
    this.#appliesTo = options.appliesTo;
    this.#dependencies = options.dependencies;
    this.#message = options.message;
  }

  get requirementId(): string {
    return this.#requirementId;
  }

  get requirementName(): string {
    return this.#requirementName;
  }

  get version(): string | undefined {
    return this.#version;
  }

  get appliesTo(): string[] | undefined {
    return this.#appliesTo;
  }

  get dependencies(): string[] | undefined {
    return this.#dependencies;
  }

  get rootNode(): string {
    return this.#rootNode;
  }

  get nodes(): Node[] {
    return this.#nodes;
  }

  get message(): string | undefined {
    return this.#message;
  }

  getNode(id: string): Node {
    const node = this.#nodes.find((candidate) => candidate.id === id);
    if (!node) {
      throw new Error(`node '${id}' not found in tree '${this.#requirementId}'`);
    }
    return node;
  }

  toJSON() {
    return {
      requirementId: this.requirementId,
      requirementName: this.requirementName,
      version: this.version,
      appliesTo: this.appliesTo,
      dependencies: this.dependencies,
      rootNode: this.rootNode,
      nodes: this.nodes.map((node) => node.toJSON()),
      message: this.message,
    };
  }

  static create(raw: unknown): DecisionTree {
    const parsed = DecisionTreeSchema.parse(raw);
    return new DecisionTree(
      parsed.requirementId,
      parsed.requirementName,
      parsed.rootNode,
      parsed.nodes.map(createNode),
      {
        version: parsed.version,
        appliesTo: parsed.appliesTo,
        dependencies: parsed.dependencies,
        message: parsed.message,
      },
    );
  }
}
