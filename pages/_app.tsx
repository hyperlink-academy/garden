import "styles/globals.css";
import type { AppProps } from "next/app";
import React from "react";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "hooks/useAuth";
import { useRouter } from "next/router";
import { SpaceSpaceProvider } from "components/ReplicacheProvider";
import Head from "next/head";
import { SmokeProvider } from "components/Smoke";
import { SWRConfig } from "swr";
import { HomeLayout } from "components/HomeLayout";

export default function App({ Component, pageProps }: AppProps) {
  let router = useRouter();
  // dev routes
  // if (router.pathname.startsWith("/dev")) return <Component {...pageProps} />;
  // top level home
  if (router.pathname === "/") {
    return (
      <SharedProviders>
        <Component {...pageProps} />
      </SharedProviders>
    );
  }
  // individual space layout
  if (router.pathname.startsWith("/s/[studio]/s/[space]")) {
    return (
      <SharedProviders>
        <SpaceSpaceProvider
          notFound={<div className="p-4">404d space</div>}
          loading={<></>}
        >
          <Component {...pageProps} />
        </SpaceSpaceProvider>
      </SharedProviders>
    );
  }
  // shared logged in homepage: studio + calendar
  if (
    router.pathname.startsWith("/s/[studio]") ||
    router.pathname.startsWith("/studio")
  ) {
    return (
      <SharedProviders>
        <HomeLayout {...pageProps}>
          <Component {...pageProps} />
        </HomeLayout>
      </SharedProviders>
    );
  }

  if (router.pathname.startsWith("/landing")) {
    return <Component {...pageProps} />;
  }

  // default fallback
  return (
    <SharedProviders>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SharedProviders>
  );
}

const SharedProviders: React.FC<React.PropsWithChildren<unknown>> = (props) => {
  return (
    <SWRCache>
      <SmokeProvider>
        <Head>
          <meta
            name="viewport"
            content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content"
          />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta
            name="apple-mobile-web-app-status-bar-style"
            content="black-translucent"
          />
        </Head>
        <AuthProvider>{props.children}</AuthProvider>
        <Analytics />
      </SmokeProvider>
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

const Layout: React.FC<React.PropsWithChildren<unknown>> = (props) => {
  return (
    <>
      <Head>
        <title key="title">Hyperlink Academy</title>
      </Head>
      <div style={{ maxWidth: "48rem", margin: "auto", padding: "1rem" }}>
        {props.children}
      </div>
    </>
  );
};
