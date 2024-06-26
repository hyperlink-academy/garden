import { useCallback } from "react";
import { sortByPosition } from "src/position_helpers";
import { create } from "zustand";
import { combine, createJSONStorage, persist } from "zustand/middleware";
import { db, useMutations, useSpaceID } from "./useReplicache";
import { Filters } from "components/CardFilter";

export let useUIState = create(
  persist(
    combine(
      {
        mobileSidebarOpen: false,
        spaces: {} as {
          [spaceID: string]: {
            activeRoom?: string;
            rooms: {
              [roomID: string]: { card: string; parent: string | null }[];
            };
          };
        },
        roomStates: {} as {
          [entityID: string]: {
            filters: Filters;
          };
        },
        cardStates: {} as {
          [entityID: string]: {
            drawer: null | "backlinks" | "chat";
            drawerOpen: boolean;
          };
        },
        chatInputStates: {} as {
          [entityID: string]: {
            value: string;
            attachedCards: string[];
            reply?: string | null;
          };
        },
      },
      (set) => ({
        setChatInput: (
          entityID: string,
          data: {
            value?: string;
            attachedCards?: string[];
            reply?: string | null;
          }
        ) => {
          set((state) => ({
            chatInputStates: {
              ...state.chatInputStates,
              [entityID]: {
                ...state.chatInputStates[entityID],
                ...data,
              },
            },
          }));
        },
        setChatInputAttachedCards: (
          entityID: string,
          attachedCards: string[]
        ) => {
          set((state) => ({
            chatInputStates: {
              ...state.chatInputStates,
              [entityID]: {
                ...state.chatInputStates[entityID],
                attachedCards,
              },
            },
          }));
        },
        setChatInputValue: (entityID: string, value: string) => {
          set((state) => ({
            chatInputStates: {
              ...state.chatInputStates,
              [entityID]: {
                ...state.chatInputStates[entityID],
                value,
              },
            },
          }));
        },
        setMobileSidebarOpen: (open?: boolean) => {
          set((state) => ({
            mobileSidebarOpen:
              open === undefined ? !state.mobileSidebarOpen : open,
          }));
        },
        openDrawer: (entityID: string, drawer: "backlinks" | "chat") => {
          set((state) => ({
            ...state,
            cardStates: {
              ...state.cardStates,
              [entityID]: {
                ...state.cardStates[entityID],
                drawer,
                drawerOpen: true,
              },
            },
          }));
        },
        closeDrawer: (entityID: string) => {
          set((state) => ({
            ...state,
            cardStates: {
              ...state.cardStates,
              [entityID]: {
                ...state.cardStates[entityID],
                drawerOpen: false,
              },
            },
          }));
        },
        setRoom: (spaceID: string, room: string | undefined) => {
          set((state) => ({
            mobileSidebarOpen: false,
            spaces: {
              ...state.spaces,
              [spaceID]: {
                ...state.spaces[spaceID],
                activeRoom: room,
              },
            },
          }));
        },
        setFilters: (entityID: string, filters: Filters) => {
          set((state) => ({
            roomStates: {
              ...state.roomStates,
              [entityID]: {
                ...state.roomStates[entityID],
                filters,
              },
            },
          }));
        },
        closeCard: ({
          spaceID,
          roomID,
          card,
        }: {
          spaceID: string;
          roomID: string;
          card: string;
        }) => {
          useUIState.setState((state) => ({
            spaces: {
              ...state.spaces,
              [spaceID]: {
                ...state.spaces[spaceID],
                rooms: {
                  [roomID]:
                    state.spaces?.[spaceID]?.rooms?.[roomID]?.filter(
                      (c) => c.card !== card
                    ) || [],
                },
              },
            },
          }));
        },
        openCard: ({
          spaceID,
          roomID,
          card,
          parent,
          append,
        }: {
          spaceID: string;
          roomID: string;
          card: string;
          parent: string | null;
          append?: boolean;
        }) => {
          set((state) => {
            let currentCards = state.spaces[spaceID]?.rooms?.[roomID] || [];
            let parentIndex = parent
              ? currentCards.findIndex((c) => c.card === parent)
              : -1;
            if (currentCards.find((c) => c.card === card)) return state;
            let newCards: { card: string; parent: string | null }[] = [];
            if (!append)
              newCards = [
                ...currentCards.slice(0, parentIndex + 1),
                { card, parent },
              ];
            if (append) {
              let lastSibling = currentCards
                .slice(parentIndex + 1)
                .findIndex((c) => c.parent !== parent);
              console.log(parent);
              console.log(currentCards.slice(parentIndex + 1));
              console.log(lastSibling);
              if (lastSibling === -1)
                lastSibling = currentCards.slice(parentIndex + 1).length;
              newCards = [
                ...currentCards.slice(0, parentIndex + 1 + lastSibling),
                { card, parent },
                ...currentCards.slice(parentIndex + 1 + lastSibling),
              ];
            }

            return {
              spaces: {
                ...state.spaces,
                [spaceID]: {
                  ...state.spaces[spaceID],
                  rooms: {
                    ...state.spaces[spaceID]?.rooms,
                    [roomID]: newCards,
                  },
                },
              },
            };
          });
        },
      })
    ),
    {
      name: "ui-state",
      storage: createJSONStorage(() => window.sessionStorage),
    }
  )
);

export let useRoom = () => {
  let spaceID = useSpaceID();
  let firstRoomByID = db
    .useAttribute("room/name")
    .sort(sortByPosition("roomList"))[0]?.entity;
  return (
    useUIState((state) =>
      spaceID ? state.spaces[spaceID]?.activeRoom : null
    ) || firstRoomByID
  );
};

export const useIsActiveRoom = (room: string) => {
  let spaceID = useSpaceID();
  let firstRoomByID = db
    .useAttribute("room/name")
    .sort(sortByPosition("roomList"))[0]?.entity;

  let isActive = useUIState((state) =>
    spaceID && state.spaces[spaceID]
      ? state.spaces[spaceID]?.activeRoom === room
      : null
  );

  if (isActive === null) return firstRoomByID === room;
  return isActive;
};

export let useRoomHistory = () => {
  let spaceID = useSpaceID();
  return useUIState((state) => {
    if (!spaceID) return [];
    let activeRoom = state.spaces[spaceID]?.activeRoom;
    if (!activeRoom) return [];
    return state.spaces[spaceID]?.rooms[activeRoom] || [];
  });
};

export const useOpenCard = () => {
  let sid = useSpaceID();
  let { action } = useMutations();
  let openCard = useUIState((state) => state.openCard);
  let closeCard = useUIState((state) => state.closeCard);
  let roomID = useRoom();
  return useCallback(
    (args: { card: string; parent: null | string; append?: boolean }) => {
      if (!sid || !roomID) return;
      let spaceID = sid;
      openCard({ ...args, spaceID, roomID });
      action.add({
        undo: () => {
          closeCard({ ...args, spaceID, roomID });
        },
        redo: () => {
          openCard({ ...args, spaceID, roomID });
        },
      });
    },
    [sid, action, closeCard, openCard, roomID]
  );
};

export const useRemoveCardFromRoomHistory = () => {
  let spaceID = useSpaceID();
  let { action } = useMutations();
  return useCallback(
    ({ cardEntity, room }: { cardEntity: string; room: string }) => {
      if (!spaceID) return;
      let sID = spaceID;

      if (!room) return;
      let history = useUIState.getState().spaces[spaceID]?.rooms?.[room] || [];
      useUIState.setState((state) => ({
        spaces: {
          ...state.spaces,
          [sID]: {
            ...state.spaces[sID],
            rooms: {
              ...state.spaces[sID].rooms,
              [room]: history.filter((h) => h.card !== cardEntity),
            },
          },
        },
      }));
      action.add({
        undo: () => {
          useUIState.setState((state) => ({
            spaces: {
              ...state.spaces,
              [sID]: {
                ...state.spaces[sID],
                rooms: {
                  [room]: history,
                },
              },
            },
          }));
        },
        redo: () => {
          useUIState.setState((state) => ({
            spaces: {
              ...state.spaces,
              [sID]: {
                ...state.spaces[sID],
                rooms: {
                  [room]: history.filter((h) => h.card !== cardEntity),
                },
              },
            },
          }));
        },
      });
    },
    [spaceID, action]
  );
};

export const useCloseCard = () => {
  let sid = useSpaceID();
  let { action } = useMutations();
  let room = useRoom();

  return useCallback(
    (card: string) => {
      if (!sid) return;
      let spaceID = sid;
      if (!room) return;

      let state = useUIState.getState();
      let previousCards = state.spaces[spaceID]?.rooms?.[room];
      let closeCard = useUIState.getState().closeCard;
      closeCard({ spaceID, roomID: room, card });
      action.add({
        undo: () => {
          useUIState.setState((state) => ({
            spaces: {
              ...state.spaces,
              [spaceID]: {
                ...state.spaces[spaceID],
                rooms: {
                  [room]: previousCards || [],
                },
              },
            },
          }));
        },
        redo: () => {
          closeCard({ spaceID, roomID: room, card });
        },
      });
    },
    [sid, action, room]
  );
};

export const useCurrentOpenCard = () => {
  let room = useRoom();
  let spaceID = useSpaceID();

  let history = useUIState((s) => {
    if (!spaceID || !room) return [];
    return s.spaces[spaceID]?.rooms?.[room] || [];
  });
  return history[0];
};

export const useSetRoom = () => {
  let spaceID = useSpaceID();
  let { action } = useMutations();
  let set = useUIState((state) => state.setRoom);
  return useCallback(
    (room: string) => {
      if (!spaceID) return;
      let currentRoom = useUIState.getState().spaces[spaceID]?.activeRoom;
      set(spaceID, room);
      action.add({
        undo: () => {
          if (!spaceID) return;
          set(spaceID, currentRoom);
        },
        redo: () => {
          if (!spaceID) return;
          set(spaceID, room);
        },
      });
    },
    [spaceID, action]
  );
};
