import "styles/globals.css";
import type { AppProps } from "next/app";
import React from "react";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
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
