import toast from "react-hot-toast";

import type { NotificationService } from "./NotificationService";

export class NotificationManager implements NotificationService {
  success(message: string): void {
    toast.success(message);
  }

  error(message: string): void {
    toast.error(message);
  }

  errorWithFallback(message: string): void {
    this.error(message || "Si è verificato un errore");
  }
}
