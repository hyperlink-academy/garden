import { CardView } from "components/CardView";
import { useIndex } from "hooks/useReplicache";
import Head from "next/head";
import { useRouter } from "next/router";
export default () => {
  let router = useRouter();
  let CardID = router.query.card as string;
  return (
    <>
      <CardTitle card={CardID} />
      <div className="pb-4 h-full">
        <CardView entityID={CardID} />
      </div>
    </>
  );
};

const CardTitle = (props: { card: string }) => {
  let cardTitle = useIndex.eav(props.card, "card/title");
  return (
    <Head>
      <title key="title">{cardTitle?.value || "Untitled"}</title>
    </Head>
  );
};
