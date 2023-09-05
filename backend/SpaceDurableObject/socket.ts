import { SpaceDurableObject } from ".";

export function connect(this: SpaceDurableObject, request: Request): Response {
  const upgradeHeader = request.headers.get("Upgrade");
  if (!upgradeHeader || upgradeHeader !== "websocket") {
    return new Response("Expected Upgrade: websocket", { status: 426 });
  }

  console.log("yooo connecting socket!");
  try {
    const webSocketPair = new WebSocketPair();
    const client = webSocketPair[0],
      server = webSocketPair[1];

    this.state.acceptWebSocket(server);
    this.poke();

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  } catch (e) {
    console.log(e);
    return new Response(null, { status: 500 });
  }
}
