import { z } from "zod";

const nodeCode = z.string().min(1).max(32);

const BranchesSchema = z.object({
  yes: nodeCode,
  no: nodeCode,
});

const QuestionNodeSchema = z.object({
  id: nodeCode,
  type: z.literal("question"),
  text: z.string().min(1).max(1000),
  branches: BranchesSchema,
});

const LeafNodeSchema = z.object({
  id: nodeCode,
  type: z.literal("leaf"),
  outcome: z.enum(["PASS", "FAIL", "NOT_APPLICABLE"]),
  text: z.string().max(1000).optional(),
});

export const NodeSchema = z.discriminatedUnion("type", [QuestionNodeSchema, LeafNodeSchema]);

export type NodeRaw = z.infer<typeof NodeSchema>;
export type Branches = z.infer<typeof BranchesSchema>;
export type Outcome = "PASS" | "FAIL" | "NOT_APPLICABLE";

// Contratto astratto comune: QuestionNode e LeafNode lo implementano ciascuna
// in modo indipendente (nessuna gerarchia di classi, nessuno stato condiviso).
export interface NodeContract {
  readonly id: string;
  readonly type: "question" | "leaf";
  next(answer: boolean): string;
  verdict(): Outcome | null;
}

export class QuestionNode implements NodeContract {
  readonly #id: string;
  readonly #text: string;
  readonly #branches: Branches;

  constructor(id: string, text: string, branches: Branches) {
    this.#id = id;
    this.#text = text;
    this.#branches = branches;
  }

  get id(): string {
    return this.#id;
  }

  get type(): "question" {
    return "question";
  }

  get text(): string {
    return this.#text;
  }

  get branches(): Branches {
    return this.#branches;
  }

  next(answer: boolean): string {
    return answer ? this.#branches.yes : this.#branches.no;
  }

  verdict(): Outcome | null {
    return null;
  }

  toJSON() {
    return { id: this.id, type: this.type, text: this.text, branches: this.branches };
  }
}

export class LeafNode implements NodeContract {
  readonly #id: string;
  readonly #outcome: Outcome;
  readonly #text: string | undefined;

  constructor(id: string, outcome: Outcome, text?: string) {
    this.#id = id;
    this.#outcome = outcome;
    this.#text = text;
  }

  get id(): string {
    return this.#id;
  }

  get type(): "leaf" {
    return "leaf";
  }

  get outcome(): Outcome {
    return this.#outcome;
  }

  get text(): string | undefined {
    return this.#text;
  }

  next(): string {
    throw new TypeError("un nodo foglia non ha un nodo successivo");
  }

  verdict(): Outcome | null {
    return this.#outcome;
  }

  toJSON() {
    return { id: this.id, type: this.type, outcome: this.outcome, text: this.text };
  }
}

// Unione usata da tutti i chiamanti: consente il narrowing su `.type`
// (node.type === "leaf" => node ha .outcome), che una classe base astratta
// con `extends` non permetterebbe.
export type Node = QuestionNode | LeafNode;

export function createNode(raw: NodeRaw): Node {
  return raw.type === "question"
    ? new QuestionNode(raw.id, raw.text, raw.branches)
    : new LeafNode(raw.id, raw.outcome, raw.text);
}
