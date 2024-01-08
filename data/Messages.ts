export type Message = {
  id: string;
  topic: string;
  sender: string;
  content: string;
  entity?: string;
  replyTo?: string | null;
  ts: string;
  server_ts?: string;
};
