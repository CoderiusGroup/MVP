export interface NotificationService {
  success(message: string): void;
  error(message: string): void;
  errorWithFallback(message: string): void;
}
