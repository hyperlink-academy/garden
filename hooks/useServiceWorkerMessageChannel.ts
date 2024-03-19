import { useEffect } from "react";
import { ServiceWorkerMessages } from "worker";
import { useRouter } from "next/navigation";

export const useServiceWorkerMessageChannel = () => {
  let router = useRouter();
  useEffect(() => {
    if (!navigator.serviceWorker) return;
    const messageChannel = new MessageChannel();
    let message: ServiceWorkerMessages = { type: "init" };
    navigator.serviceWorker.controller?.postMessage(message, [
      messageChannel.port2,
    ]);
    messageChannel.port1.onmessage = (event) => {
      let data: ServiceWorkerMessages = event.data;
      if (data.type === "navigate")
        router.push(
          `${data.spaceURL}${data.card ? `?openCard=${data.card}` : ""}`
        );
    };

    return () => {
      messageChannel.port1.close();
    };
  }, [router]);
};
