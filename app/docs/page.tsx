import { HelpDocs } from "components/HelpCenter";
import { GoBackToPageLined } from "components/Icons";
import Link from "next/link";

export const metadata = {
  title: "Hyperlink Docs",
};

export default function DocsPage() {
  return (
    <div className="docs mx-auto flex max-w-3xl flex-col gap-8 px-4 py-4 md:px-8 md:py-8">
      <div className="flex flex-col gap-2 text-center">
        <h2>Hyperlink Docs</h2>
        <Link
          href="/"
          className="mx-auto flex items-center justify-center gap-2 hover:text-accent-blue"
        >
          <GoBackToPageLined />
          home
        </Link>
      </div>
      <HelpDocs />
    </div>
  );
}
