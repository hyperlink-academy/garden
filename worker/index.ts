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

export type ServiceWorkerMessages = {
  type: "navigate-to-card";
  data: {
    cardEntity: string;
  };
};

self.addEventListener("notificationclick", async (event) => {
  console.log(event);
  let data: HyperlinkNotification = event.notification.data;
  event.waitUntil(
    (async () => {
      let clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const urlToOpen = new URL(data.data.spaceURL, self.location.origin).href;
      let client: null | WindowClient = null;
      for (const c of clientList) {
        if (c.url.includes(urlToOpen) && "focus" in c) {
          client = c;
        }
      }
      if (!client) client = await self.clients.openWindow(urlToOpen);
      if (!client) return;

      await client.focus();
      setTimeout(() => {
        client?.postMessage({
          type: "navigate-to-card",
          data: { cardEntity: data.data.message.topic },
        } as ServiceWorkerMessages);
      }, 500);
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
