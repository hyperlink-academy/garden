import { useEffect } from "react";
import { sortByPosition } from "src/position_helpers";
import { db, scanIndex, useMutations, useSpaceID } from "./useReplicache";
import { useRoom, useSetRoom, useUIState } from "./useUIState";
import { useSearchParams, useRouter } from "next/navigation";

export const useSpaceSyncState = () => {
  let query = useSearchParams();
  let { rep } = useMutations();
  let room = useRoom();
  let spaceID = useSpaceID();
  let setRoom = useSetRoom();
  let setRoomWithoutHistory = useUIState((s) => s.setRoom);
  let openCardWithoutHistory = useUIState((s) => s.openCard);

  let firstRoom = db
    .useAttribute("room/name")
    .sort(sortByPosition("roomList"))[0]?.entity;
  let r = useUIState((state) =>
    spaceID ? state.spaces[spaceID]?.activeRoom : null
  );

  useEffect(() => {
    if (!r && firstRoom) setRoom(firstRoom);
  }, [r, firstRoom]);

  let openCard = query?.get("openCard");
  useEffect(() => {
    if (openCard) {
      (async () => {
        let entityID = openCard as string;
        if (!room || !spaceID || !rep) return;

        let url = new URL(window.location.href);
        url.searchParams.delete("openCard");

        history.replaceState(null, "", url);

        let isRoom = await rep.query((tx) =>
          scanIndex(tx).eav(entityID, "room/type")
        );
        if (isRoom) return setRoom(entityID);

        let parent = await rep.query((tx) =>
          scanIndex(tx).vae(entityID, "desktop/contains")
        );
        if (parent) setRoom(parent[0]?.entity);
        openCardWithoutHistory(spaceID, parent[0]?.entity || room, entityID);
      })();
    }
  }, [rep, openCard, room, spaceID]);

  useEffect(() => {
    if (!spaceID) return;
    let storedRoom = window.localStorage.getItem(`space/${spaceID}/room`);
    if (storedRoom) setRoomWithoutHistory(spaceID, storedRoom);
  }, [spaceID, setRoomWithoutHistory]);

  useEffect(() => {
    if (room && spaceID)
      window.localStorage.setItem(`space/${spaceID}/room`, room);
  }, [room, spaceID]);
};
