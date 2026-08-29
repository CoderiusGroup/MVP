import { ApiError } from "./ApiError";
import type { ApiClientService } from "./ApiClientService";

export class FetchApiClient implements ApiClientService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  private buildUrl(path: string) {
    return `${this.baseUrl}${path}`;
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await fetch(this.buildUrl(path), init);
    } catch {
      throw new ApiError("Errore di rete: impossibile contattare il server");
    }

    const text = await response.text();
    if (!response.ok) {
      throw new ApiError(text || response.statusText, response.status);
    }
    return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" });
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  postFormData<T>(path: string, body: FormData): Promise<T> {
    return this.request<T>(path, { method: "POST", body });
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }
}
