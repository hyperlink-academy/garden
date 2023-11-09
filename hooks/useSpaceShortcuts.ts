import { useEffect } from "react";
import { useOpenCard, useRoom, useSetRoom, useUIState } from "./useUIState";
import { db, scanIndex, useMutations, useSpaceID } from "./useReplicache";
import { sortByPosition } from "src/position_helpers";
import { ReadTransaction } from "replicache";

export function useSpaceShortcuts() {
  useRoomShortcuts();
  useCardShortcuts();
}
export function useRoomShortcuts() {
  let currentRoom = useRoom();
  let setRoom = useSetRoom();
  let rooms = db.useAttribute("room/name").sort(sortByPosition("roomList"));
  useEffect(() => {
    let listener = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" && e.altKey) {
        let currentIndex = rooms.findIndex((r) => r.entity === currentRoom);
        if (currentIndex === -1) return;
        if (currentIndex > 0) {
          setRoom(rooms[currentIndex - 1].entity);
        }
      }
      if (e.key === "ArrowDown" && e.altKey) {
        let currentIndex = rooms.findIndex((r) => r.entity === currentRoom);
        if (currentIndex === -1) return;
        if (currentIndex < rooms.length) {
          setRoom(rooms[currentIndex + 1].entity);
        }
      }
    };
    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, [currentRoom, setRoom, rooms]);
}

export function useCardShortcuts() {
  let currentRoom = useRoom();
  let spaceID = useSpaceID();
  let openCard = useOpenCard();
  let { rep } = useMutations();

  useEffect(() => {
    if (!rep || !currentRoom) return;
    let r = rep;
    let listener = async (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "TEXTAREA") return;
      if (e.key === "ArrowUp" && e.shiftKey) {
        let state = useUIState.getState();
        if (!spaceID) return;
        let currentCard =
          state.spaces[spaceID]?.rooms?.[currentRoom]?.[0] || null;

        let sortedCards = await r.query((tx) =>
          getSortedCards(tx, currentRoom)
        );
        if (!sortedCards) return;
        let currentIndex = sortedCards.findIndex(
          (r) => r.value.value === currentCard
        );
        if (currentIndex === -1) return;
        if (currentIndex > 0) {
          openCard(sortedCards[currentIndex - 1].value.value);
        }
      }
      if (e.key === "ArrowDown" && e.shiftKey) {
        let state = useUIState.getState();
        if (!spaceID) return;
        let currentCard =
          state.spaces[spaceID]?.rooms?.[currentRoom]?.[0] || null;
        let sortedCards = await r.query((tx) =>
          getSortedCards(tx, currentRoom)
        );
        if (!sortedCards) return;
        let currentIndex = sortedCards.findIndex(
          (r) => r.value.value === currentCard
        );
        if (currentIndex === -1) return;
        if (currentIndex < sortedCards.length - 1) {
          openCard(sortedCards[currentIndex + 1].value.value);
        }
      }
    };
    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, [currentRoom, rep, openCard]);
}

const getSortedCards = async (tx: ReadTransaction, room: string) => {
  let cards = await scanIndex(tx).eav(room, "desktop/contains");
  let roomType = await scanIndex(tx).eav(room, "room/type");
  if (!roomType) return null;
  if (roomType.value == "collection") {
    cards = cards.sort(sortByPosition("eav"));
  }
  if (roomType.value === "canvas") {
    cards = (
      await Promise.all(
        cards.map(async (c) => {
          let position = await scanIndex(tx).eav(c.id, "card/position-in");
          return {
            ...c,
            position: position?.value,
          };
        })
      )
    ).sort((a, b) => {
      if (!a.position || !b.position) return 0;
      const rowA = Math.floor(a.position.y / 10);
      const rowB = Math.floor(b.position.y / 10);

      if (rowA === rowB) {
        // If within the same row, sort by x value descending
        return b.position.x - a.position.x;
      }
      return rowA - rowB; // Otherwise, sort by row number ascending
    });
  }
  return cards;
};
