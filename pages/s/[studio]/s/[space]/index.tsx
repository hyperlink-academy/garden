import { Desktop } from "components/Desktop";
import { CardViewerLayout } from "components/CardViewerContext";

export default function SpacePage() {
  return (
    <CardViewerLayout EmptyState={<EmptyState />}>
      <Desktop />
    </CardViewerLayout>
  );
}

const EmptyState = () => {
  return (
    <div
      className={`
                w-full
                max-w-3xl
                overflow-y-scroll       
                relative
                no-scrollbar
                snap-y snap-mandatory snap-start
                border border-dashed border-grey-80 rounded-lg
                text-grey-35
                flex flex-col gap-6
                p-4
                `}
    >
      <h3>Welcome!</h3>
      <p>
        To the <strong>left</strong> is the <strong>Desktop</strong>, a canvas
        for working with cards.
      </p>
      <ul className="list-disc list-outside ml-4">
        <li>
          Double click to add a card — regular cards, decks, or chat cards
        </li>
        <li>Move, rotate, and resize cards</li>
        <li>
          Drag a card into a deck, or on top of another card to make a new deck
        </li>
      </ul>
      <p>
        Here on the <strong>right</strong> is your <strong>Card Viewer</strong>.
      </p>
      <ul className="list-disc list-outside ml-4">
        <li>To open cards, click from the Desktop or search above</li>
        <li>Cards will stack temporarily as you browse</li>
      </ul>
      <p>
        Above the Desktop, view <strong>Space info</strong> and{" "}
        <strong>Highlights</strong>.
      </p>
      <p>
        Click the same icon on any card to add a <strong>new Highlight</strong>{" "}
        for others to see.
      </p>
    </div>
  );
};
