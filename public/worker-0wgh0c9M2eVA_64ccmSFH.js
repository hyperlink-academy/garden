(()=>{"use strict";var e={r:e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}};e.r({}),self.__WB_DISABLE_DEV_LOGS=!0,self.addEventListener("notificationclick",(async e=>{console.log(e);let t=e.notification.data;e.waitUntil((async()=>{let n,i=await self.clients.matchAll({type:"window",includeUncontrolled:!0});if(n="joined-space"===t.type?new URL(`${t.data.spaceURL}`,self.location.origin):new URL(`${t.data.spaceURL}?openCard=${t.data.message.topic}`,self.location.origin),i[0]){let e=a.get(i[0]);if(await i[0].focus(),e){let a={type:"navigate",spaceURL:t.data.spaceURL,card:"new-message"===t.type?t.data.message.topic:void 0};e.postMessage(a)}else await i[0].navigate(n)}else await self.clients.openWindow(n);e.notification.close()})())})),self.addEventListener("push",(async e=>{var a;const t=JSON.parse((null==e||null===(a=e.data)||void 0===a?void 0:a.text())||"{}");null==e||e.waitUntil((async()=>"joined-space"===t.type?self.registration.showNotification(`${t.data.newMemberUsername} joined ${t.data.spaceName}`,{data:t,body:"Say hello!",icon:"/android-chrome-192x192.png",badge:"/android-chrome-192x192.png"}):self.registration.showNotification(`${t.data.title||"Untitled Card"} in ${t.data.spaceName}`,{data:t,body:`${t.data.senderUsername}: ${t.data.message.content}`,icon:"/android-chrome-192x192.png",badge:"/android-chrome-192x192.png"}))())}));const a=new Map;self.addEventListener("message",(async e=>{let t=e.data;t&&"init"===t.type&&e.source&&a.set(e.source,e.ports[0])}))})();