import type { ApiClientService } from "./ApiClientService";

export class FetchApiClient implements ApiClientService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  private buildUrl(path: string) {
    return `${this.baseUrl}${path}`;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const text = await response.text();
    if (!response.ok) {
      throw new Error(text || response.statusText);
    }
    return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
  }

  get<T>(path: string): Promise<T> {
    return fetch(this.buildUrl(path), { method: "GET" }).then((response) =>
      this.handleResponse<T>(response),
    );
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return fetch(this.buildUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((response) => this.handleResponse<T>(response));
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return fetch(this.buildUrl(path), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((response) => this.handleResponse<T>(response));
  }

  delete<T>(path: string): Promise<T> {
    return fetch(this.buildUrl(path), { method: "DELETE" }).then((response) =>
      this.handleResponse<T>(response),
    );
  }
}
