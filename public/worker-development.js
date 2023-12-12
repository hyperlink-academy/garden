/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
__webpack_require__.r(__webpack_exports__);

//@ts-ignore
self.__WB_DISABLE_DEV_LOGS = true;
self.addEventListener("notificationclick", async event => {
  console.log(event);
  let data = event.notification.data;
  event.waitUntil((async () => {
    let clientList = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    });
    let urlToOpen;
    if (data.type === "joined-space") urlToOpen = new URL(`${data.data.spaceURL}`, self.location.origin);else urlToOpen = new URL(`${data.data.spaceURL}?openCard=${data.data.message.topic}`, self.location.origin);
    if (clientList[0]) {
      let port = MessageChannels.get(clientList[0]);
      await clientList[0].focus();
      if (!port) {
        await clientList[0].navigate(urlToOpen);
      } else {
        let message = {
          type: "navigate",
          spaceURL: data.data.spaceURL,
          card: data.type === "new-message" ? data.data.message.topic : undefined
        };
        port.postMessage(message);
      }
    } else {
      await self.clients.openWindow(urlToOpen);
    }
    event.notification.close();
  })());
});
self.addEventListener("push", async event => {
  var _event$data;
  const data = JSON.parse((event === null || event === void 0 ? void 0 : (_event$data = event.data) === null || _event$data === void 0 ? void 0 : _event$data.text()) || "{}");
  event === null || event === void 0 ? void 0 : event.waitUntil((() => {
    if (data.type === "joined-space") {
      return self.registration.showNotification(`${data.data.newMemberUsername} joined ${data.data.spaceName}`, {
        data: data,
        body: `Say hello!`,
        icon: "/android-chrome-192x192.png",
        badge: "/android-chrome-192x192.png"
      });
    }
    return self.registration.showNotification(`${data.data.title || "Untitled Card"} in ${data.data.spaceName}`, {
      data: data,
      body: `${data.data.senderUsername}: ${data.data.message.content}`,
      icon: "/android-chrome-192x192.png",
      badge: "/android-chrome-192x192.png"
    });
  })());
});
const MessageChannels = new Map();
self.addEventListener("message", async message => {
  let messageData = message.data;
  if (messageData && messageData.type === "init" && message.source) {
    MessageChannels.set(message.source, message.ports[0]);
  }
});
/******/ })()
;