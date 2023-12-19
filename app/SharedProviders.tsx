"use client";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "hooks/useAuth";
import { SmokeProvider } from "components/Smoke";
import { SWRConfig } from "swr";
import { useServiceWorkerMessageChannel } from "hooks/useServiceWorkerMessageChannel";
import { CallProvider } from "components/Calls/CallProvider";
export const SharedProviders: React.FC<React.PropsWithChildren<unknown>> = (
  props
) => {
  useServiceWorkerMessageChannel();
  return (

    <SWRCache>
        <CallProvider>
      <SmokeProvider>
        <AuthProvider>{props.children}</AuthProvider>
        <Analytics />
      </SmokeProvider>
      </CallProvider>
    </SWRCache>
  );
};

let SWRCache: React.FC<React.PropsWithChildren<unknown>> = (props) => {
  return (
    <SWRConfig
      value={{
        provider: (cache) => {
          let localMap = new Map<any, any>([]);
          if (typeof window !== "undefined") {
            const localMap = new Map<any, any>(
              JSON.parse(localStorage.getItem("app-cache") || "[]")
            );
            addEventListener("beforeunload", () => {
              const appCache = JSON.stringify(Array.from(localMap.entries()));
              localStorage.setItem("app-cache", appCache);
            });
          }

          return {
            keys: cache.keys,
            get(key: string) {
              if (key.startsWith("persist")) return localMap.get(key);
              return cache.get(key);
            },
            set(key: string, value) {
              if (key.startsWith("persist")) return localMap.set(key, value);
              return cache.set(key, value);
            },
            delete(key: string) {
              if (key.startsWith("persist")) return localMap.delete(key);
              return cache.delete(key);
            },
          };
        },
      }}
    >
      {props.children}
    </SWRConfig>
  );
};