import { ulid } from "src/ulid";
import { SpaceDurableObject } from ".";

export function connect(this: SpaceDurableObject, request: Request): Response {
  const upgradeHeader = request.headers.get("Upgrade");
  if (!upgradeHeader || upgradeHeader !== "websocket") {
    return new Response("Expected Upgrade: websocket", { status: 426 });
  }

  console.log("yooo connecting socket!");
  let id = ulid();
  const webSocketPair = new WebSocketPair();
  const client = webSocketPair[0],
    server = webSocketPair[1];

  //@ts-ignore
  server.accept();

  server.addEventListener("close", () => {
    this.sockets = this.sockets.filter((s) => s.id !== id);
  });

  this.sockets.push({
    id,
    socket: server,
  });

  return new Response(null, {
    status: 101,
    //@ts-ignore
    webSocket: client,
  });
}
