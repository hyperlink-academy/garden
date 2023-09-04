import { useCallback } from "react";
import { create } from "zustand";
import { combine } from "zustand/middleware";
import { useMutations, useSpaceID } from "./useReplicache";

export let useUIState = create(
  combine(
    {
      spaces: {} as {
        [spaceID: string]: {
          activeRoom?: string;
          rooms: {
            [roomID: string]: string[];
          };
        };
      },
      focusedCard: undefined as string | undefined,
    },
    (set) => ({
      setRoom: (spaceID: string, room: string | undefined) => {
        set((state) => ({
          spaces: {
            [spaceID]: {
              ...state.spaces[spaceID],
              activeRoom: room,
            },
          },
        }));
      },
      closeCard: (spaceID: string, roomID: string) => {
        console.log("closing card");
        set((state) => ({
          spaces: {
            [spaceID]: {
              rooms: {
                [roomID]: state.spaces[spaceID]?.rooms[roomID]?.slice(1) || [],
              },
            },
          },
        }));
      },
      openCard: (spaceID: string, roomID: string, card: string) => {
        set((state) => {
          let currentCard = state.spaces[spaceID]?.rooms?.[roomID]?.[0];
          if (currentCard === card) return state;
          return {
            spaces: {
              [spaceID]: {
                rooms: {
                  [roomID]: [
                    card,
                    ...(state.spaces[spaceID]?.rooms?.[roomID] || []),
                  ],
                },
              },
            },
          };
        });
      },
      setFocusedCard: (entityID: string | undefined) =>
        set({ focusedCard: entityID }),
    })
  )
);

export let useRoom = () => {
  let spaceID = useSpaceID();
  return useUIState((state) =>
    spaceID ? state.spaces[spaceID]?.activeRoom : null
  );
};

export const useOpenCard = () => {
  let spaceID = useSpaceID();
  let { action } = useMutations();
  let openCard = useUIState((state) => state.openCard);
  let closeCard = useUIState((state) => state.closeCard);
  return useCallback(
    (entityID: string) => {
      if (!spaceID) return;

      let room = useUIState.getState().spaces[spaceID]?.activeRoom;

      if (!room) return;
      console.log("open card");
      openCard(spaceID, room, entityID);
      action.add({
        undo: () => {
          console.log("undoin");
          closeCard(spaceID as string, room as string);
        },
        redo: () => {
          openCard(spaceID as string, room as string, entityID);
        },
      });
    },
    [spaceID, action]
  );
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
