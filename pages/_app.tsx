import "styles/globals.css";
import type { AppProps } from "next/app";
import React from "react";
import { AuthProvider, useAuth } from "hooks/useAuth";
import Link from "next/link";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}

const Layout: React.FC = (props) => {
  let auth = useAuth();
  return (
    <div>
      <div className="p-2 border-2">
        {auth.session.loggedIn ? (
          <button onClick={() => auth.logout()}>logout</button>
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
