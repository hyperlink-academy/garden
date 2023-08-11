export {};
declare let self: ServiceWorkerGlobalScope;

//@ts-ignore
self.__WB_DISABLE_DEV_LOGS = true;

export type HyperlinkNotification = {
  type: "new-message";
  data: {
    spaceID: string;
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
});

self.addEventListener("push", async (event) => {
  console.log("yoooo");
  const data: Notification = JSON.parse(event?.data?.text() || "{}");
  console.log(data);

  event?.waitUntil(
    self.registration.showNotification(
      `${data.data.title || "Untitled Card"} in ${data.data.spaceName}}`,
      {
        tag: "hyperlink-messages",
        body: `${data.data.senderUsername}: ${data.data.message.content}`,
        icon: "/android-chrome-192x192.png",
        badge: "/android-chrome-192x192.png",
      }
    )
  );
});