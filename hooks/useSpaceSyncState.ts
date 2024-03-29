import { useEffect } from "react";
import { db, scanIndex, useMutations, useSpaceID } from "./useReplicache";
import { useRoom, useSetRoom, useUIState } from "./useUIState";
import { useSearchParams } from "next/navigation";

export const useSpaceSyncState = () => {
  let query = useSearchParams();
  let { rep } = useMutations();
  let room = useRoom();
  let spaceID = useSpaceID();
  let setRoom = useSetRoom();
  let openCardWithoutHistory = useUIState((s) => s.openCard);

  let openCard = query?.get("openCard");
  useEffect(() => {
    if (openCard && room && spaceID && rep) {
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
  }, [rep, openCard, room, spaceID, openCardWithoutHistory, setRoom]);
};
