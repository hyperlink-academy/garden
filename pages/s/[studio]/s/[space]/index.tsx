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
                w-full h-full
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
      <p className="m-auto">
        <em>Open a card!</em>
      </p>
    </div>
  );
};
