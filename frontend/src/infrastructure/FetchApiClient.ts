import type { ApiClientService } from "./ApiClientService";

export class FetchApiClient implements ApiClientService {
  get<T>(_path: string): Promise<T> {
    throw new Error("not implemented");
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
