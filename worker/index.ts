export {};
declare let self: ServiceWorkerGlobalScope;

//@ts-ignore
self.__WB_DISABLE_DEV_LOGS = true;

export type HyperlinkNotification = {
  type: "new-message";
  data: {
    spaceID: string;
    spaceURL: string;
    spaceName: string;
    title: string;
    senderUsername: string;
    message: {
      id: string;
      content: string;
      topic: string;
    };
  };
};

self.addEventListener("notificationclick", async (event) => {
  console.log(event);
  let data: HyperlinkNotification = event.notification.data;
  event.waitUntil(
    (async () => {
      let clientList = await self.clients.matchAll({
        type: "window",
      });
      for (const client of clientList) {
        if (client.url === data.data.spaceURL && "focus" in client) {
          client.focus();
          return;
        }
      }
      return self.clients.openWindow(data.data.spaceURL);
    })()
  );
});

self.addEventListener("push", async (event) => {
  console.log("yoooo");
  const data: Notification = JSON.parse(event?.data?.text() || "{}");
  console.log(data);

  event?.waitUntil(
    self.registration.showNotification(
      `${data.data.title || "Untitled Card"} in ${data.data.spaceName}`,
      {
        tag: "hyperlink-messages",
        data: data,
        body: `${data.data.senderUsername}: ${data.data.message.content}`,
        icon: "/android-chrome-192x192.png",
        badge: "/android-chrome-192x192.png",
      }
    )
  );
});
