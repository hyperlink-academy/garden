import { CardView } from "components/CardView";
import { useRouter } from "next/router";
export default () => {
  let router = useRouter();
  let CardID = router.query.card as string;
  return (
    <div className="py-2 px-3 h-full">
      <CardView entityID={CardID} />
    </div>
  );
};
