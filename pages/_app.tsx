import "styles/globals.css";
import type { AppProps } from "next/app";
import React from "react";
import { AuthProvider } from "hooks/useAuth";
import { useRouter } from "next/router";
import { SpaceSpaceProvider } from "components/ReplicacheProvider";
import { SpaceLayout } from "components/SpaceLayout";
import Head from "next/head";
import { SmokeProvider } from "components/Smoke";
import { SWRConfig } from "swr";

export default function App({ Component, pageProps }: AppProps) {
  let router = useRouter();
  if (router.pathname.startsWith("/dev")) return <Component {...pageProps} />;
  if (router.pathname === "/")
    return (
      <SharedProviders>
        <Component {...pageProps} />
      </SharedProviders>
    );

  if (router.pathname.startsWith("/s/[studio]/s/[space]")) {
    return (
      <SharedProviders>
        <SpaceSpaceProvider
          notFound={<div className="p-4">404'd space</div>}
          loading={<div className="p-4">loading space…</div>}
        >
          <SpaceLayout>
            <Component {...pageProps} />
          </SpaceLayout>
        </SpaceSpaceProvider>
      </SharedProviders>
    );
  }
  return (
    <SharedProviders>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SharedProviders>
  );
}

const SharedProviders: React.FC = (props) => {
  return (
    <SmokeProvider>
      <AuthProvider>
        <SWRCache>{props.children}</SWRCache>
      </AuthProvider>
    </SmokeProvider>
  );
};

let SWRCache: React.FC = (props) => {
  return (
    <SWRConfig
      value={{
        provider: (cache) => {
          const localMap = new Map(
            JSON.parse(localStorage.getItem("app-cache") || "[]")
          );
          window.addEventListener("beforeunload", () => {
            const appCache = JSON.stringify(Array.from(localMap.entries()));
            localStorage.setItem("app-cache", appCache);
          });

          return {
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

const Layout: React.FC = (props) => {
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
