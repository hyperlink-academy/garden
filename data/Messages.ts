export type Message = {
  id: string;
  topic: string;
  sender: string;
  content: string;
  entity?: string;
  ts: string;
};
