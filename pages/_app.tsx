import "styles/globals.css";
import type { AppProps } from "next/app";
import React from "react";
import { AuthProvider, useAuth } from "hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }: AppProps) {
  let router = useRouter();
  if (router.pathname.startsWith("/library"))
    return <Component {...pageProps} />;
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
    <div style={{maxWidth: "48rem", margin: "auto",}}>
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
