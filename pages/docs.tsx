import { HelpDocs } from "components/HelpCenter";
import Head from "next/head";

export default function DocsPage() {
  return (
    <>
      <Head>
        <title key="title">Hyperlink Docs</title>
      </Head>
      <div className="grid-rows-max mx-auto grid gap-4">
        <HelpDocs />
      </div>
    </>
  );
}
