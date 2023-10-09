import "styles/globals.css";
import type { AppProps } from "next/app";
import React from "react";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "hooks/useAuth";
import { useRouter } from "next/router";
import Head from "next/head";
import { SmokeProvider } from "components/Smoke";
import { SWRConfig } from "swr";
import { HomeLayout } from "components/HomeLayout";
import { CallProvider } from "components/Calls/CallProvider";
import { useServiceWorkerMessageChannel } from "hooks/useServiceWorkerMessageChannel";

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
        <CallProvider>
          <Component {...pageProps} />
        </CallProvider>
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
  useServiceWorkerMessageChannel();
  return (
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
