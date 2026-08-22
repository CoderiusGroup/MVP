import { DecisionTreeSchema, type DecisionTree } from "../domain/entities/DecisionTree";
import type { ApiClientService } from "../infrastructure/ApiClientService";
import { FetchApiClient } from "../infrastructure/FetchApiClient";

export class DecisionTreeService {
  private readonly api: ApiClientService;

  constructor(api: ApiClientService = new FetchApiClient()) {
    this.api = api;
  }

  async getTree(requirementId: string): Promise<DecisionTree> {
    const data = await this.api.get<unknown>(`/decision-trees/${requirementId}`);
    return DecisionTreeSchema.parse(data);
  }
}

export const decisionTreeService = new DecisionTreeService();
