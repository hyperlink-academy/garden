import { useEffect } from "react";
import { ServiceWorkerMessages } from "worker";
import Router from "next/router";

export const useServiceWorkerMessageChannel = () => {
  useEffect(() => {
    const messageChannel = new MessageChannel();
    let message: ServiceWorkerMessages = { type: "init" };
    navigator.serviceWorker.controller?.postMessage(message, [
      messageChannel.port2,
    ]);
    messageChannel.port1.onmessage = (event) => {
      let data: ServiceWorkerMessages = event.data;
      if (data.type === "navigate")
        Router.push(
          `${data.spaceURL}${data.card ? `?openCard=${data.card}` : ""}`
        );
    };

    return () => {
      messageChannel.port1.close();
    };
  }, []);
};
