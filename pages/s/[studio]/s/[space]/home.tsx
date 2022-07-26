import { CardsList } from "components/CardsList";
import { SpaceInfo } from "components/SpaceInfo";

export default function SpacePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <SpaceInfo />
      {/* so far this is nearly identical to Space index.tsx */}
      {/* just renders CardsList (one "Home" deck) instead of DeckList */}
      {/* TODO other stuff idk! */}
      <CardsList />
    </div>
  );
}
