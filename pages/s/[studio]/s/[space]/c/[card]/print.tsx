import { RenderedText } from "components/Textarea/RenderedText";
import { useIndex } from "hooks/useReplicache";
import { useRouter } from "next/router";
import Head from "next/head";
export default function PrintCardPage() {
  let router = useRouter();
  let CardID = router.query.card as string;
  let content = useIndex.eav(CardID, "card/content");
  let title = useIndex.eav(CardID, "card/title");
  return (
    <>
      <Head>
        <title key="title">{title?.value || "Untitled"}</title>
      </Head>
      <div className="max-w-3xl w-full m-auto flex flex-col gap-4">
        <h2>{title?.value}</h2>
        <RenderedText
          text={content?.value || ""}
          className="w-full whitespace-pre-wrap"
        />
        <p className="text-grey-55 italic pt-8">
          {content?.value.trim().split(/\s+/).length} words
        </p>
      </div>
    </>
  );
}
