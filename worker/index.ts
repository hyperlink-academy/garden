import { defaultCache } from "@serwist/next/browser";
import { installSerwist } from "@serwist/sw";
export {};
declare let self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: string[];
  __WB_DISABLE_DEV_LOGS: boolean;
};

self.__WB_DISABLE_DEV_LOGS = true;

installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

export type HyperlinkNotification =
  | {
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
    }
  | {
      type: "joined-space";
      data: {
        spaceID: string;
        spaceURL: string;
        spaceName: string;
        newMemberUsername: string;
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

      let urlToOpen: URL;
      if (data.type === "joined-space")
        urlToOpen = new URL(`${data.data.spaceURL}`, self.location.origin);
      else
        urlToOpen = new URL(
          `${data.data.spaceURL}?openCard=${data.data.message.topic}`,
          self.location.origin
        );
      if (clientList[0]) {
        let port = MessageChannels.get(clientList[0]);
        await clientList[0].focus();
        if (!port) {
          await clientList[0].navigate(urlToOpen);
        } else {
          let message: ServiceWorkerMessages = {
            type: "navigate",
            spaceURL: data.data.spaceURL,
            card:
              data.type === "new-message" ? data.data.message.topic : undefined,
          };
          port.postMessage(message);
        }
      } else {
        await self.clients.openWindow(urlToOpen);
      }
      event.notification.close();
    })()
  );
});

self.addEventListener("push", async (event) => {
  const data: HyperlinkNotification = JSON.parse(event?.data?.text() || "{}");

  event?.waitUntil(
    (() => {
      if (data.type === "joined-space") {
        return self.registration.showNotification(
          `${data.data.newMemberUsername} joined ${data.data.spaceName}`,
          {
            data: data,
            body: `Say hello!`,
            icon: "/android-chrome-192x192.png",
            badge: "/android-chrome-192x192.png",
          }
        );
      }
      return self.registration.showNotification(
        `${data.data.title || "Untitled Card"} in ${data.data.spaceName}`,
        {
          data: data,
          body: `${data.data.senderUsername}: ${data.data.message.content}`,
          icon: "/android-chrome-192x192.png",
          badge: "/android-chrome-192x192.png",
        }
      );
    })()
  );
});

const MessageChannels = new Map<
  Client | ServiceWorker | MessagePort,
  MessagePort
>();

export type ServiceWorkerMessages =
  | {
      type: "init";
    }
  | {
      type: "close";
    }
  | {
      type: "navigate";
      spaceURL: string;
      card?: string;
    };

self.addEventListener("message", async (message) => {
  let messageData: ServiceWorkerMessages = message.data;
  if (messageData && messageData.type === "init" && message.source) {
    MessageChannels.set(message.source, message.ports[0]);
  }
});
