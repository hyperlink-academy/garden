import { DeckList } from "components/DeckList";
import { SpaceInfo } from "components/SpaceInfo";

export default function SpacePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <SpaceInfo />
      <DeckList />
    </div>
  );
}
