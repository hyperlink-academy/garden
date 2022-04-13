import "styles/globals.css";
import type { AppProps } from "next/app";
import React from "react";
import { AuthProvider, useAuth } from "hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/router";
import { SpaceSpaceProvider } from "components/ReplicacheProvider";
import { SpaceLayout } from "components/SpaceLayout";

export default function App({ Component, pageProps }: AppProps) {
  let router = useRouter();
  if (router.pathname.startsWith("/library"))
    return <Component {...pageProps} />;
  if (router.pathname.startsWith("/s/[studio]/s/[space]")) {
    return (
      <AuthProvider>
        <SpaceSpaceProvider
          notFound={<div>404'd space</div>}
          loading={<div>loading space</div>}
        >
          <SpaceLayout>
            <Component {...pageProps} />
          </SpaceLayout>
        </SpaceSpaceProvider>
      </AuthProvider>
    );
  }
  return (
    <AuthProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}

const Layout: React.FC = (props) => {
  let { session } = useAuth();
  return (
    <div style={{ maxWidth: "48rem", margin: "auto" }}>
      <div className="p-2 border-2 mb-8">
        {session.loggedIn ? (
          <Link href={`/s/${session.session.username}`}>
            <a>studio</a>
          </Link>
        ) : (
          <Link href="/login">
            <a>login</a>
          </Link>
        )}
      </div>
      {props.children}
    </div>
  );
};
