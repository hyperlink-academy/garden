import { useEffect, useMemo } from "react";
import { useRoom, useSetRoom, useUIState } from "./useUIState";
import { db, scanIndex, useMutations, useSpaceID } from "./useReplicache";
import { sortByPosition } from "src/position_helpers";
import { ReadTransaction } from "replicache";
import { Filters } from "components/CardFilter";
import { useCardViewer } from "components/CardViewerContext";

export function useSpaceShortcuts() {
  useRoomShortcuts();
  useCardShortcuts();
}

export function useRoomShortcuts() {
  let currentRoom = useRoom();
  let setRoom = useSetRoom();
  let spaceRooms = db
    .useAttribute("room/name")
    .sort(sortByPosition("roomList"));
  let { memberEntity } = useMutations();
  let rooms = useMemo(() => {
    let allRooms = [{ entity: "calendar" }, ...spaceRooms];
    if (memberEntity) allRooms.unshift({ entity: "unreads" });
    return allRooms;
  }, [spaceRooms, memberEntity]);
  useEffect(() => {
    let listener = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "INPUT"
      )
        return;
      if (e.key === "ArrowUp" && e.altKey) {
        e.preventDefault();
        let currentIndex = rooms.findIndex((r) => r.entity === currentRoom);
        if (currentIndex === -1) return;
        if (currentIndex > 0) {
          setRoom(rooms[currentIndex - 1].entity);
        }
      }
      if (e.key === "ArrowDown" && e.altKey) {
        e.preventDefault();
        let currentIndex = rooms.findIndex((r) => r.entity === currentRoom);
        if (currentIndex === -1) return;
        if (currentIndex < rooms.length - 1) {
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
  let { open } = useCardViewer();
  let { rep } = useMutations();
  let filters = useUIState((s) => s.roomStates[currentRoom]?.filters) || [];

  useEffect(() => {
    if (!rep || !currentRoom) return;
    let r = rep;
    let listener = async (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "INPUT"
      )
        return;
      if (e.key === "Enter") {
        //TODO we should look at this or fix this if we do selection state for cards
        //let el = document.getElementById(document.getElementById);
        // e.preventDefault();
        //if (el) el.focus();
      }
      if (e.key === "ArrowUp" && e.shiftKey) {
        e.preventDefault();
        let state = useUIState.getState();
        if (!spaceID) return;
        let currentCard =
          state.spaces[spaceID]?.rooms?.[currentRoom]?.[0] || null;

        let sortedCards = await r.query((tx) =>
          getSortedCards(tx, currentRoom, filters)
        );
        if (!sortedCards) return;

        let currentIndex = sortedCards.findIndex(
          (r) => r.value.value === currentCard
        );
        if (!currentCard || currentIndex === -1) {
          open({
            entityID: sortedCards[sortedCards.length - 1].value.value,
            parent: null,
          });
          return;
        }
        if (currentIndex > 0) {
          open({
            entityID: sortedCards[currentIndex - 1].value.value,
            parent: null,
          });
        }
      }
      if (e.key === "ArrowDown" && e.shiftKey) {
        e.preventDefault();
        let state = useUIState.getState();
        if (!spaceID) return;
        let currentCard =
          state.spaces[spaceID]?.rooms?.[currentRoom]?.[0] || null;
        let sortedCards = await r.query((tx) =>
          getSortedCards(tx, currentRoom, filters)
        );

        if (!sortedCards) return;
        let currentIndex = sortedCards.findIndex(
          (r) => r.value.value === currentCard
        );
        if (!currentCard || currentIndex === -1) {
          open({ entityID: sortedCards[0]?.value.value, parent: null });
          return;
        }
        if (currentIndex === -1) return;
        if (currentIndex < sortedCards.length - 1) {
          open({
            entityID: sortedCards[currentIndex + 1].value.value,
            parent: null,
          });
        }
      }
    };
    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
    };
  }, [currentRoom, rep, open, filters]);
}

const getSortedCards = async (
  tx: ReadTransaction,
  room: string,
  filters: Filters
) => {
  let cards = await scanIndex(tx).eav(room, "desktop/contains");
  if (filters.length > 0) {
    cards = (
      await Promise.all(
        cards.map(async (c) => {
          let reactions = (
            await scanIndex(tx).eav(c.value.value, "card/reaction")
          ).map((r) => r.value);
          return {
            ...c,
            reactions,
          };
        })
      )
    ).filter((card) => {
      let passed = true;
      for (let filter of filters) {
        if (filter.not)
          passed = passed && !card.reactions.includes(filter.reaction);
        else passed = passed && card.reactions.includes(filter.reaction);
      }
      return passed;
    });
  }
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
