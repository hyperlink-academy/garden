import "styles/globals.css";
import type { AppProps } from "next/app";
import React from "react";
import { AuthProvider, useAuth } from "hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/router";
import { SpaceSpaceProvider } from "components/ReplicacheProvider";
import { SpaceLayout } from "components/SpaceLayout";
import Head from "next/head";
import { SmokeProvider } from "components/Smoke";

export default function App({ Component, pageProps }: AppProps) {
  let router = useRouter();
  if (router.pathname.startsWith("/library"))
    return <Component {...pageProps} />;
  if (router.pathname.startsWith("/s/[studio]/s/[space]")) {
    return (
      <SmokeProvider>
        <AuthProvider>
          <SpaceSpaceProvider
            notFound={<div className="p-4">404'd space</div>}
            loading={<div className="p-4">loading space…</div>}
          >
            <SpaceLayout>
              <Component {...pageProps} />
            </SpaceLayout>
          </SpaceSpaceProvider>
        </AuthProvider>
      </SmokeProvider>
    );
  }
  return (
    <SmokeProvider>
      <AuthProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </AuthProvider>
    </SmokeProvider>
  );
}

const Layout: React.FC = (props) => {
  let { session } = useAuth();
  return (
    <>
      <Head>
        <title key="title">Hyperlink Garden</title>
      </Head>
      <div style={{ maxWidth: "48rem", margin: "auto", padding: "1rem" }}>
        {props.children}
      </div>
    </>
  );
};
