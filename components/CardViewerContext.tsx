import { useAppEventListener, publishAppEvent } from "hooks/useEvents";
import { useIndex, useMutations } from "hooks/useReplicache";
import { useUndoableState } from "hooks/useUndoableState";
import { useEffect } from "react";
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
  let { mutate, memberEntity } = useMutations();
  let unreadBy = useIndex.eav(history[0] || null, "card/unread-by") || [];
  useEffect(() => {
    if (history[0] && memberEntity) {
      let unread = unreadBy.find((f) => f.value.value === memberEntity);
      if (unread) mutate("retractFact", { id: unread.id });
    }
  }, [history[0], unreadBy, memberEntity]);

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
