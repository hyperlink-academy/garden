import { CardViewer } from "components/CardViewerContext";
import { db, scanIndex, useMutations, useSpaceID } from "hooks/useReplicache";
import { SmallCardDragContext } from "components/DragContext";
import { Sidebar } from "components/SpaceLayout";
import { useEffect } from "react";
import useWindowDimensions from "hooks/useWindowDimensions";
import { sortByPosition } from "src/position_helpers";
import { Room } from "components/Room";
import { SpaceMetaTitle } from "components/SpaceMetaTitle";
import { useRoom, useSetRoom, useUIState } from "hooks/useUIState";
import { useRouter } from "next/router";
import { PresenceHandler } from "components/PresenceHandler";

export default function SpacePage() {
  // get first room = your room
  // OR if viewing anon, get first room based on room id
  let firstRoomByID = db
    .useAttribute("room/name")
    .sort(sortByPosition("roomList"))[0]?.entity;
  let firstRoom = firstRoomByID;

  let spaceID = useSpaceID();
  let r = useRoom();
  let room = r || firstRoom;
  let setRoom = useSetRoom();
  let setRoomWithoutHistory = useUIState((s) => s.setRoom);

  useEffect(() => {
    if (!r && firstRoom) setRoom(firstRoom);
  }, [r, firstRoom]);

  let { query, replace } = useRouter();
  let { rep } = useMutations();
  let openCardWithoutHistory = useUIState((s) => s.openCard);
  useEffect(() => {
    if (query.openCard) {
      (async () => {
        let entityID = query.openCard as string;
        if (!room || !spaceID || !rep) return;

        let url = new URL(window.location.href);
        url.searchParams.delete("openCard");
        replace(url, undefined, { shallow: true });

        let isRoom = await rep.query((tx) =>
          scanIndex(tx).eav(entityID, "room/type")
        );
        if (isRoom) return setRoom(entityID);

        let parent = await rep.query((tx) =>
          scanIndex(tx).vae(entityID, "desktop/contains")
        );
        if (parent) setRoom(parent[0]?.entity);
        openCardWithoutHistory(spaceID, room, entityID);
      })();
    }
  }, [rep, query.openCard, room, spaceID]);

  useEffect(() => {
    if (!spaceID) return;
    let storedRoom = window.localStorage.getItem(`space/${spaceID}/room`);
    if (storedRoom) setRoomWithoutHistory(spaceID, storedRoom);
  }, [spaceID, setRoomWithoutHistory]);

  useEffect(() => {
    if (room && spaceID)
      window.localStorage.setItem(`space/${spaceID}/room`, room);
  }, [room, spaceID]);

  const { width } = useWindowDimensions();

  useEffect(() => {
    window.requestAnimationFrame(() => {
      let roomPane = document.getElementById("desktopWrapper");
      roomPane?.scrollIntoView();
    });
  }, []);

  return (
    <>
      <SpaceMetaTitle />
      <PresenceHandler />

      <div className="pageWrapperflex safari-pwa-height h-[100dvh] flex-col items-stretch justify-items-center gap-2 overflow-hidden sm:gap-4">
        <div className="pageContent max-w-screen-xl relative mx-auto flex h-full w-full grow items-stretch md:py-6 md:px-4">
          <SmallCardDragContext>
            {width > 960 ? (
              <div
                className="contentLargeSplitLayout no-scrollbar flex w-full flex-row items-stretch gap-4 overflow-x-scroll sm:justify-center sm:gap-4"
              // you need to add this to the contentSplitLayout class if you are going to scroll across more than 2 panes
              // it prevents the last pane from sticking to the end
              // after:content-[""] after:h-full after:w-2 after:block after:shrink-0
              >
                <div className="roomWrapper flex flex-row rounded-md border border-grey-90">
                  <Sidebar
                    onRoomChange={(room) => {
                      setRoom(room);
                    }}
                    currentRoom={room}
                  />

                  <div className="desktopWrapper no-scrollbar relative flex h-full flex-shrink-0 flex-col gap-0">
                    <Room entityID={room} key={room} />
                  </div>
                </div>

                <CardViewer room={room} />
              </div>
            ) : (
              <div className="no-scrollbar flex snap-x snap-mandatory flex-row gap-2 overflow-x-scroll overscroll-x-none scroll-smooth">
                <div className="snap-end snap-always">
                  <Sidebar
                    onRoomChange={(room) => {
                      setRoom(room);
                      let roomPane = document.getElementById("roomWrapper");
                      setTimeout(() => {
                        roomPane?.scrollIntoView({ behavior: "smooth" });
                      }, 10);
                    }}
                    currentRoom={room}
                  />
                </div>
                <div
                  id="roomWrapper"
                  className="roomWrapper pwa-padding relative flex snap-center snap-always flex-row py-4"
                >
                  <div
                    id="desktopWrapper"
                    className="desktopWrapper no-scrollbar relative flex h-full flex-shrink-0 flex-col gap-0 rounded-md border border-grey-90"
                  >
                    <Room entityID={room} key={room} />
                  </div>
                </div>

                <div className="pwa-padding py-4 pr-2">
                  <CardViewer room={room} />
                </div>
              </div>
            )}
          </SmallCardDragContext>
        </div>
      </div>
    </>
  );
}
