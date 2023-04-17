import { useAppEventListener, publishAppEvent } from "hooks/useEvents";
import { useIndex, useMutations } from "hooks/useReplicache";
import { useUndoableState } from "hooks/useUndoableState";
import { useEffect, useRef } from "react";
import { CardView } from "./CardView";

export const useCardViewer = () => {
  return {
    open: (args: { entityID: string; focus?: "title" | "content" }) => {
      publishAppEvent("cardviewer.open-card", args);
    },
    close: (args: { entityID: string }) => {
      publishAppEvent("cardviewer.close-card", args);
    },
  };
};

export function CardViewer(props: {
  EmptyState: React.ReactNode;
  room: string | null;
}) {
  let [history, setHistory] = useUndoableState<{ [k: string]: string[] }>({});
  let ref = useRef<HTMLDivElement | null>(null);
  let { mutate, memberEntity } = useMutations();
  let unreadBy = useIndex.eav(
    props.room ? history[props.room]?.[0] || null : null,
    "card/unread-by"
  );
  useEffect(() => {
    if (props.room && history[props.room]?.[0] && memberEntity) {
      let unread = unreadBy?.find((f) => f.value.value === memberEntity);
      if (unread)
        mutate("markRead", {
          memberEntity,
          entityID: history[props.room][0],
          attribute: "card/unread-by",
        });
    }
  }, [history, props.room, unreadBy, memberEntity, mutate]);

  useAppEventListener(
    "cardviewer.open-card",
    (data) => {
      setHistory((h) => {
        if (!props.room) return h;
        let room = h[props.room] || [];
        if (room[0] === data.entityID) return h;
        return {
          ...h,
          [props.room]: [data.entityID, ...room],
        };
      });
      setTimeout(() => {
        ref.current?.scrollIntoView({ inline: "center", behavior: "smooth" });
        if (data.focus) {
          if (data.focus === "content") {
            let element = document.getElementById("default-text-section");
            console.log(element);
            element?.focus();
          }
          if (data.focus === "title")
            document.getElementById("card-title")?.focus();
        }
      }, 10);
    },
    [props.room]
  );

  useAppEventListener(
    "cardviewer.close-card",
    (data) => {
      setHistory((h) => {
        if (!props.room) return h;
        let room = h[props.room] || [];
        return {
          ...h,
          [props.room]: room.filter((r) => r !== data.entityID),
        };
      });
    },
    [props.room]
  );

  return (
    <div
      ref={ref}
      id="cardViewerWrapper"
      className={`cardViewerWrapper 
          flex h-full w-[calc(100vw-16px)] 
          max-w-3xl shrink-0        
          touch-pan-x snap-center snap-always
          flex-col 
          items-stretch focus:outline-none sm:shrink`}
    >
      {props.room && history[props.room]?.[0] ? (
        <CardView
          entityID={history[props.room][0]}
          key={history[props.room][0]}
          onDelete={() =>
            setHistory((h) => {
              if (!props.room) return h;
              let room = h[props.room] || [];
              return {
                ...h,
                [props.room]: room.slice(1),
              };
            })
          }
        />
      ) : (
        props.EmptyState
      )}
    </div>
  );
}
