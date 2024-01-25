import { HelpDocs } from "components/HelpCenter";

export const metadata = {
  title: "Hyperlink Docs",
};

export default function DocsPage() {
  return (
    <>
      <div className="grid-rows-max mx-auto grid gap-4">
        <HelpDocs />
      </div>
    </>
  );
}
