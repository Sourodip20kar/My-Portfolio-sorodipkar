// src/components/types.ts
export type HistoryItem = {
  id: string; // Add this line
  command: string;
  output: string;
  completed: boolean;
};
