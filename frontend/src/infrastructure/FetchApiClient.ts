import type { ApiClientService } from "./ApiClientService";
import { NotificationManager } from "./NotificationManager.ts";
import { DeviceSchema } from "../domain/entities/Device.ts";


const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
const notification = new NotificationManager();


export class FetchApiClient implements ApiClientService {
  private buildUrl(path: string){
    return `${BASE_URL}${path}`;
  }

  private async handleResponse<T>(response: Response): Promise<T>{
    const text = await response.text();
    if(!response.ok){
      /* notification.error(text || response.statusText) */
      throw new Error(text || response.statusText);
    }
    /* return text ? DeviceSchema.parse(JSON.parse(text)) as T : (undefined as unknown as T); */
    return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
  }

  get<T>(_path: string): Promise<T> {
    return fetch(this.buildUrl(_path), {method: "GET"}).then((response) => this.handleResponse<T>(response));
  }

  post<T>(_path: string, _body: unknown): Promise<T> {
    return fetch(this.buildUrl(_path),{
      method: "POST",
      headers: {"Content-Type": "application/json" },
      body: JSON.stringify(_body),
    }).then((response) => this.handleResponse<T>(response));
  }

  put<T>(_path: string, _body: unknown): Promise<T> {
    return fetch(this.buildUrl(_path),{
      method: "PUT",
      headers: {"Content-Type": "application/json" },
      body: JSON.stringify(_body),
    }).then((response) => this.handleResponse<T>(response));
  }

  delete<T>(_path: string): Promise<T> {
    return fetch(this.buildUrl(_path), {method: "DELETE"}).then((response) => this.handleResponse<T>(response));
  }
}
