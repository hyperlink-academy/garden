export type Message = {
  id: string;
  topic: string;
  index?: number;
  attachedCards?: string[];
  sender: string;
  content: string;
  entity?: string;
  ts: string;
};
