import { ref } from "data/Facts";
import { useAppEventListener, publishAppEvent } from "hooks/useEvents";
import { db, useMutations } from "hooks/useReplicache";
import { useUndoableState } from "hooks/useUndoableState";
import { useRouter } from "next/router";
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

export function CardViewer(props: { room: string | null }) {
  let roomType = db.useEntity(props.room, "room/type")?.value;
  let [history, setHistory] = useUndoableState<{ [k: string]: string[] }>({});
  let cardViewerRef = useRef<HTMLDivElement | null>(null);
  let { mutate, memberEntity, client } = useMutations();
  let unreadBy = db.useEntity(
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
  useEffect(() => {
    if (!client || !props.room) return;
    let currentCard = history[props.room]?.[0];
    if (!currentCard) return;
    mutate("assertEmphemeralFact", {
      clientID: client.clientID,
      entity: client.entity,
      attribute: "presence/on-card",
      value: ref(currentCard),
      positions: {},
    });
  }, [props.room, history, client, mutate]);

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
        cardViewerRef.current?.scrollIntoView({
          inline: "center",
          behavior: "smooth",
        });
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

  let { query, replace } = useRouter();
  useEffect(() => {
    if (query.openCard) {
      console.log("yo this should work");
      let entityID = query.openCard as string;
      if (!props.room) return;
      let url = new URL(window.location.href);
      url.searchParams.delete("openCard");
      replace(url, undefined, { shallow: true });
      setHistory((h) => {
        if (!props.room) return h;
        let room = h[props.room] || [];
        if (room[0] === entityID) return h;
        return {
          ...h,
          [props.room]: [entityID, ...room],
        };
      });
      setTimeout(() => {
        cardViewerRef.current?.scrollIntoView({
          inline: "center",
          behavior: "smooth",
        });
      }, 200);
    }
  }, [query.openCard, props.room]);

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
      ref={cardViewerRef}
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
        <EmptyState roomType={roomType} />
      )}
    </div>
  );
}

const EmptyState = (props: { roomType: string | undefined }) => {
  return (
    <div className="no-scrollbar relative flex h-full w-full max-w-3xl snap-y snap-mandatory snap-start flex-col gap-6 overflow-y-scroll rounded-lg border border-dashed border-grey-80 p-4 text-grey-35">
      <div className="m-auto flex flex-col gap-4 text-center">
        {props.roomType === "canvas" ? (
          <>
            <p>
              <em>Double-click canvas to add a card</em>
            </p>
            <p>
              <em>Drag a card to move it</em>
            </p>
          </>
        ) : props.roomType === "collection" ? (
          <>
            <p>
              <em>Click a card to open it here</em>
            </p>
            <p>
              <em>Drag cards to reorder</em>
            </p>
          </>
        ) : (
          // if not 'canvas' or 'collection', it's chat
          <>
            <p>
              <em>Attach cards to chat messages</em>
            </p>
            <p>
              <em>Click to open them here</em>
            </p>
          </>
        )}
      </div>
    </div>
  );
};
