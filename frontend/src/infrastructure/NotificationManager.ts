import toast from "react-hot-toast";

import type { NotificationService } from "./NotificationService";

export class NotificationManager implements NotificationService {
  success(message: string): void {
    toast.success(message);
  }

  error(message: string): void {
    toast.error(message);
  }
  
  errorJsonLoading(message: string): void {
      this.error(message || "Errore nel caricamento del file JSON");
  }
}
