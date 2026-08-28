import { z } from "zod";

import { DecisionTreeSchema, type DecisionTree } from "../domain/entities/DecisionTree";
import type { ApiClientService } from "../infrastructure/ApiClientService";
import { FetchApiClient } from "../infrastructure/FetchApiClient";
import { queryClient } from "../infrastructure/queryClient";

export const DecisionTreeSummarySchema = z.object({
  requirementId: z.string().min(1),
  requirementName: z.string().min(1),
});

export type DecisionTreeSummary = z.infer<typeof DecisionTreeSummarySchema>;

export class DecisionTreeService {
  private readonly api: ApiClientService;

  constructor(api: ApiClientService = new FetchApiClient()) {
    this.api = api;
  }

  async listTrees(): Promise<DecisionTreeSummary[]> {
    return queryClient.fetchQuery({
      queryKey: ["decision-trees"],
      queryFn: async () => {
        const data = await this.api.get<unknown>("/decision-trees");
        return z.array(DecisionTreeSummarySchema).parse(data);
      },
    });
  }

  async getTree(requirementId: string): Promise<DecisionTree> {
    return queryClient.fetchQuery({
      queryKey: ["decision-tree", requirementId],
      queryFn: async () => {
        const data = await this.api.get<unknown>(`/decision-trees/${requirementId}`);
        return DecisionTreeSchema.parse(data);
      },
    });
  }

  async importTree(file: File): Promise<DecisionTree> {
    const formData = new FormData();
    formData.append("file", file);
    const tree = await this.api.postFormData<DecisionTree>("/decision-trees/import", formData);
    const parsedTree = DecisionTreeSchema.parse(tree);
    await queryClient.invalidateQueries({ queryKey: ["decision-trees"] });
    return parsedTree;
  }

  async exportTree(requirementId: string, format: "json" | "csv"): Promise<void> {
    const response = await fetch(`/decision-trees/${requirementId}/export?format=${format}`);
    if (!response.ok) {
      throw new Error(`Export decision tree ${requirementId} failed`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${requirementId}.${format}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}

export const decisionTreeService = new DecisionTreeService();
