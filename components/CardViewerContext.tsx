import { useAppEventListener, publishAppEvent } from "hooks/useEvents";
import { useUndoableState } from "hooks/useUndoableState";
import { CardView } from "./CardView";

export const useCardViewer = () => {
  return {
    open: (args: { entityID: string }) => {
      publishAppEvent("cardviewer.open-card", args);
    },
  };
};

export function CardViewer(props: { EmptyState: React.ReactNode }) {
  let [history, setHistory] = useUndoableState([] as string[]);

  useAppEventListener(
    "cardviewer.open-card",
    (data) => {
      setHistory((h) => {
        if (h[0] === data.entityID) return h;
        return [data.entityID, ...h];
      });
    },
    []
  );

  return (
    <div
      id="cardViewerWrapper"
      className={`cardViewerWrapper 
          flex h-full w-[calc(100vw-16px)] 
          max-w-3xl shrink-0        
          touch-pan-x snap-center
          flex-col 
          items-stretch focus:outline-none sm:shrink`}
    >
      {history[0] ? (
        <CardView
          entityID={history[0]}
          key={history[0]}
          onDelete={() => setHistory((s) => s.slice(1))}
        />
      ) : (
        props.EmptyState
      )}
    </div>
  );
}
