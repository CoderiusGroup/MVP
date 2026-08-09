import type { ApiClientService } from "./ApiClientService";

export class FetchApiClient implements ApiClientService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`);
    if (!response.ok) {
      throw new Error(`GET ${path} failed with status ${response.status}`);
    }
    return (await response.json()) as T;
  }

  post<T>(_path: string, _body: unknown): Promise<T> {
    throw new Error("not implemented");
  }

  put<T>(_path: string, _body: unknown): Promise<T> {
    throw new Error("not implemented");
  }

  delete<T>(_path: string): Promise<T> {
    throw new Error("not implemented");
  }
}
