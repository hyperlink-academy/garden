import { ref } from "data/Facts";
import { useAppEventListener, publishAppEvent } from "hooks/useEvents";
import { db, useMutations, useSpaceID } from "hooks/useReplicache";
import { useOpenCard, useUIState } from "hooks/useUIState";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef } from "react";
import { CardView } from "./CardView";

export const useCardViewer = () => {
  let spaceID = useSpaceID();
  let openCard = useOpenCard();
  let close = useCallback((args: { entityID: string }) => {
    publishAppEvent("cardviewer.close-card", args);
  }, []);
  let open = useCallback(
    (args: { entityID: string; focus?: "title" | "content" }) => {
      if (!spaceID) return;
      openCard(args.entityID);
      publishAppEvent("cardviewer.open-card", args);
    },
    [spaceID, openCard]
  );
  return {
    open,
    close,
  };
};

export function CardViewer(props: { room: string | null }) {
  let roomType = db.useEntity(props.room, "room/type")?.value;
  let spaceID = useSpaceID();

  let closeCard = useUIState((s) => s.closeCard);

  let history = useUIState((s) => {
    if (!spaceID || !props.room) return [];
    return s.spaces[spaceID]?.rooms?.[props.room] || [];
  });
  let cardViewerRef = useRef<HTMLDivElement | null>(null);
  let { mutate, memberEntity, client } = useMutations();
  let unreadBy = db.useEntity(
    props.room ? history[0] || null : null,
    "card/unread-by"
  );
  useEffect(() => {
    if (props.room && history[0] && memberEntity) {
      let unread = unreadBy?.find((f) => f.value.value === memberEntity);
      if (unread)
        mutate("markRead", {
          memberEntity,
          entityID: history[0],
          attribute: "card/unread-by",
        });
    }
  }, [history, props.room, unreadBy, memberEntity, mutate]);
  useEffect(() => {
    if (!client || !props.room) return;
    let currentCard = history[0];
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
    []
  );

  useAppEventListener(
    "cardviewer.close-card",
    () => {
      if (!props.room || !spaceID) return;
      closeCard(spaceID, props.room);
    },
    [props.room, spaceID]
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
      {props.room && history[0] ? (
        <CardView
          entityID={history[0]}
          key={history[0]}
          onDelete={() => {
            if (!props.room || !spaceID) return;
            closeCard(spaceID, props.room);
          }}
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
