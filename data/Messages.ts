export type Message = {
  id: string;
  topic: string;
  sender: string;
  content: string;
  entity?: string;
  replyTo?: string;
  ts: string;
  server_ts?: string;
};
