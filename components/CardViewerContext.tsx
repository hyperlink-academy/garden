import { ref } from "data/Facts";
import { useAppEventListener, publishAppEvent } from "hooks/useEvents";
import { db, useMutations, useSpaceID } from "hooks/useReplicache";
import {
  useOpenCard,
  useRemoveCardFromRoomHistory,
  useRoom,
  useUIState,
} from "hooks/useUIState";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { CardView } from "./CardView";
import { focusElement } from "src/utils";
import { useIsMobile } from "hooks/utils";
import { useAuth } from "hooks/useAuth";

export const useCardViewer = () => {
  let spaceID = useSpaceID();
  let openCard = useOpenCard();

  let open = useCallback(
    (args: { entityID: string; focus?: "title" | "content" }) => {
      if (!spaceID) return;
      openCard(args.entityID);
      publishAppEvent("cardviewer.open-card", args);
      if (args.focus) {
        focusElement(() =>
          document.getElementById(
            args.focus === "content" ? "default-text-section" : "card-title"
          )
        );
      }
    },
    [spaceID, openCard]
  );
  return {
    open,
  };
};

export function CardViewer(props: { space_id: string }) {
  let room = useRoom();
  let roomType = db.useEntity(room, "room/type")?.value;
  let spaceID = useSpaceID();

  let history = useUIState((s) => {
    if (!spaceID || !room) return [];
    return s.spaces[spaceID]?.rooms?.[room] || [];
  });
  let cardViewerRef = useRef<HTMLDivElement | null>(null);
  let { mutate, memberEntity, client } = useMutations();
  let { session } = useAuth();
  let unreadBy = db.useEntity(
    room ? history[0] || null : null,
    "card/unread-by"
  );
  useEffect(() => {
    if (room && history[0] && memberEntity && session.user) {
      let unread = unreadBy?.find((f) => f.value.value === memberEntity);
      if (unread)
        mutate("markRead", {
          memberEntity,
          userID: session.user.id,
          space_id: props.space_id,
          entityID: history[0],
          attribute: "card/unread-by",
        });
    }
  }, [
    history,
    room,
    unreadBy,
    memberEntity,
    mutate,
    session.user,
    props.space_id,
  ]);
  useEffect(() => {
    if (!client || !room) return;
    let currentCard = history[0];
    if (!currentCard) return;
    mutate("assertEmphemeralFact", {
      clientID: client.clientID,
      entity: client.entity,
      attribute: "presence/on-card",
      value: ref(currentCard),
      positions: {},
    });
  }, [room, history, client, mutate]);

  useAppEventListener(
    "cardviewer.open-card",
    () => {
      setTimeout(() => {
        document
          .getElementById("appLayout")
          ?.scrollTo({ behavior: "smooth", left: 5000 });
      }, 50);
    },
    []
  );
  let [render, setRender] = useState(false);
  useEffect(() => {
    setRender(true);
  }, []);
  let removeCardFromRoomHistory = useRemoveCardFromRoomHistory();
  let isMobile = useIsMobile();
  if (!render) return null;
  if (!history[0] && isMobile) return null;

  return (
    <>
      <div
        ref={cardViewerRef}
        id="cardViewerWrapper"
        className={`cardViewerWrapper
          flex  h-full w-[calc(100vw-38px)] max-w-3xl
          shrink-0 touch-pan-x
          snap-center snap-always flex-col
          items-stretch
          focus:outline-none sm:w-[calc(100vw-48px)] md:shrink`}
      >
        {room && history[0] ? (
          <CardView
            entityID={history[0]}
            key={history[0]}
            onDelete={() => {
              removeCardFromRoomHistory({ cardEntity: history[0], room });
            }}
          />
        ) : (
          <EmptyState roomType={roomType} />
        )}
      </div>
    </>
  );
}

const EmptyState = (props: { roomType: string | undefined }) => {
  let isMobile = useIsMobile();
  if (isMobile) return null;
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
