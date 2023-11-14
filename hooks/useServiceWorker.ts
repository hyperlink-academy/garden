import { useEffect } from "react";
import { ServiceWorkerMessages } from "worker";

export const useServiceWorker = () => {
  useEffect(() => {
    let listener = (message: MessageEvent) => {
      let data: ServiceWorkerMessages;
      console.log(message);
    };
    navigator.serviceWorker.addEventListener("message", listener);
    return () => {
      navigator.serviceWorker.removeEventListener("message", listener);
    };
  });
};
