import { useIndex, useMutations } from "hooks/useReplicache";
import { SmallCardList } from "./SmallCardList";

export const CardsList = () => {
  // get deck named "home"
  let deck = useIndex.ave("card/title", "Home");

  // get cards from deck
  let cards = useIndex.eav(deck?.entity || null, "deck/contains");

  // prevent complaints below about maybe null deck prop
  if (deck === null) return null;

  return (
    <div className="overflow-x-auto p-4 w-full">
      <SmallCardList
        // horizontal
        cards={cards || []}
        deck={deck.entity}
        attribute="activity/hand-contains"
        positionKey="eav"
      />
    </div>
  );
};
