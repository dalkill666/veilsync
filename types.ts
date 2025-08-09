
export type LogStatus = 'pending' | 'success' | 'error' | 'info';

export interface LogEntry {
  id: number;
  message: string;
  status: LogStatus;
}
