import { ref } from "data/Facts";
import { db, useMutations, useSpaceID } from "hooks/useReplicache";
import {
  useOpenCard,
  useRemoveCardFromRoomHistory,
  useRoom,
  useUIState,
} from "hooks/useUIState";
import { useCallback, useEffect, useState } from "react";
import { CardView } from "./CardView";
import { elementID, focusElement } from "src/utils";
import { useIsMobile } from "hooks/utils";
import { useAuth } from "hooks/useAuth";
import { useSidebarState } from "app/(app)/@sidebar/SidebarState";

export const useCardViewer = () => {
  let openCard = useOpenCard();

  let open = useCallback(
    (args: {
      entityID: string;
      focus?: "title" | "content";
      parent: string | null;
      append?: boolean;
    }) => {
      openCard({
        card: args.entityID,
        parent: args.parent,
        append: args.append,
      });
      if (!args.append)
        setTimeout(() => {
          document
            .getElementById(elementID.card(args.entityID).container)
            ?.scrollIntoView({ behavior: "smooth", inline: "center" });
        }, 100);
      if (args.focus) {
        focusElement(() =>
          document.getElementById(
            args.focus === "content"
              ? elementID.card(args.entityID)?.content
              : elementID.card(args.entityID).title
          )
        );
      }
    },
    [openCard]
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
  let { mutate, memberEntity, client } = useMutations();
  let { session } = useAuth();
  let unreadBy = db.useEntity(
    room ? history[0]?.card || null : null,
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
          entityID: history[0].card,
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
    let currentCard = history[0]?.card;
    if (!currentCard) return;
    mutate("assertEmphemeralFact", {
      clientID: client.clientID,
      entity: client.entity,
      attribute: "presence/on-card",
      value: ref(currentCard),
      positions: {},
    });
  }, [room, history, client, mutate]);

  let [render, setRender] = useState(false);
  useEffect(() => {
    setRender(true);
  }, []);
  let removeCardFromRoomHistory = useRemoveCardFromRoomHistory();
  let isMobile = useIsMobile();
  let { open } = useSidebarState();
  if (!render) return null;
  if (!history[0] && isMobile) return null;

  return (
    <>
      <div className="h-full flex flex-row gap-3">
        {history[0] ? (
          history.map((c) => {
            return (
              <div
                id={elementID.card(c.card).container}
                key={c.card}
                className={`cardViewerWrapper
                  flex  h-full w-[calc(100vw-16px)] max-w-xl
                  shrink-0 touch-pan-x
                  snap-center snap-always flex-col
                  items-stretch
                  focus:outline-none
                  sm:w-[calc(100vw-100px)] ${
                    !open
                      ? "md:w-[calc(100vw-448px)]"
                      : "md:w-[calc(100vw-670px)]"
                  } md:shrink`}
              >
                <CardView
                  entityID={c.card}
                  onDelete={() => {
                    removeCardFromRoomHistory({ cardEntity: c.card, room });
                  }}
                />
              </div>
            );
          })
        ) : (
          <div
            className={`cardViewerWrapper
              flex  h-full w-[calc(100vw-16px)] max-w-3xl
              shrink-0 touch-pan-x
              snap-center snap-always flex-col
              items-stretch
              focus:outline-none
              sm:w-[calc(100vw-100px)] ${
                !open ? "md:w-[calc(100vw-448px)]" : "md:w-[calc(100vw-670px)]"
              } md:shrink`}
          >
            <EmptyState roomType={roomType} />
          </div>
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
