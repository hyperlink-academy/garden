import { useEffect } from "react";

type AppEvent = {
  "cardviewer.open-card": { entityID: string; focus?: "title" | "content" };
  "cardviewer.close-card": { entityID: string };
};
let listeners: { callback: Function; event: string }[] = [];

export function useAppEventListener<T extends keyof AppEvent>(
  event: T,
  listener: (data: AppEvent[T]) => void,
  deps: any[]
) {
  useEffect(() => {
    listeners.push({ callback: listener, event });
    return () => {
      listeners = listeners.filter((f) => f.callback !== listener);
    };
  }, deps);
}

export function publishAppEvent<T extends keyof AppEvent>(
  event: T,
  data: AppEvent[T]
) {
  for (let listener of listeners) {
    if (listener.event === event) {
      listener.callback(data);
    }
  }
}
