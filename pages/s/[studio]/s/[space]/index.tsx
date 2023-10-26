import { CardViewer } from "components/CardViewerContext";
import { SmallCardDragContext } from "components/DragContext";
import { Sidebar } from "components/SpaceLayout";
import { useEffect, useState } from "react";
import useWindowDimensions from "hooks/useWindowDimensions";
import { Room } from "components/Room";
import { SpaceMetaTitle } from "components/SpaceMetaTitle";
import { useRoom } from "hooks/useUIState";
import { PresenceHandler } from "components/PresenceHandler";
import { useSpaceSyncState } from "hooks/useSpaceSyncState";
import { workerAPI } from "backend/lib/api";
import { WORKER_URL } from "src/constants";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next/types";
import { SpaceProvider } from "components/ReplicacheProvider";
import { SWRConfig } from "swr";
import { useViewportSize } from "hooks/useViewportSize";
import { usePreventResize } from "hooks/usePreventResize";

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps(ctx: GetStaticPropsContext) {
  if (!ctx.params?.space || !ctx.params?.studio)
    return { props: { notFound: true }, revalidate: 10 } as const;
  let data = await workerAPI(WORKER_URL, "get_space_data_by_name", {
    spaceName: ctx.params?.space as string,
    username: ctx.params?.studio as string,
  });

  if (!data.success)
    return { props: { notFound: true }, revalidate: 10 } as const;
  return { props: { notFound: false, data: data.data } };
}

type Props = InferGetStaticPropsType<typeof getStaticProps>;
export default function SpacePage(props: Props) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  if (props.notFound) return <div>404 - page not found!</div>;
  if (!isClient) return null;

  return (
    <SWRConfig value={{ fallback: { [props.data.do_id]: props.data } }}>
      <SpaceProvider id={props.data.do_id}>
        <Space />
      </SpaceProvider>
    </SWRConfig>
  );
}
function Space() {
  useSpaceSyncState();
  let room = useRoom();
  const { width } = useWindowDimensions();

  useEffect(() => {
    window.requestAnimationFrame(() => {
      let roomPane = document.getElementById("roomInnerWrapper");
      roomPane?.scrollIntoView();
    });
  }, []);

  let viewheight = useViewportSize().height;
  usePreventResize();

  return (
    <>
      <SpaceMetaTitle />
      <PresenceHandler />

      <div
        style={{ height: viewheight }}
        className="spaceWrapperflex  flex-col items-stretch justify-items-center gap-2 overflow-hidden sm:gap-4"
      >
        <div className="spaceontent max-w-screen-xl relative mx-auto flex h-full w-full grow items-stretch md:px-4 md:py-6">
          <SmallCardDragContext>
            {width > 960 || width === 0 ? (
              <div
                className="spaceLargeSplitLayout no-scrollbar flex w-full flex-row items-stretch gap-4 overflow-x-scroll sm:justify-center sm:gap-4"
                // you need to add this to the contentSplitLayout class if you are going to scroll across more than 2 panes
                // it prevents the last pane from sticking to the end
                // after:content-[""] after:h-full after:w-2 after:block after:shrink-0
              >
                <div className="spaceRoomAndSidebar flex flex-row rounded-md border border-grey-90">
                  <div className="rounded-l-md border border-transparent border-r-grey-90 bg-white">
                    <Sidebar />
                  </div>

                  <div className="spaceRoomWrapper no-scrollbar relative flex h-full flex-shrink-0 flex-col gap-0">
                    <Room entityID={room} key={room} />
                  </div>
                </div>

                <CardViewer room={room} />
              </div>
            ) : (
              <div className="no-scrollbar pwa-padding mb-3 mt-3 flex snap-x snap-mandatory flex-row overflow-y-hidden overflow-x-scroll overscroll-x-none scroll-smooth">
                <div
                  id="sidebarWrapper"
                  className="ml-2 snap-end snap-always rounded-md border border-grey-90 bg-white"
                >
                  <Sidebar />
                </div>
                <div
                  id="roomWrapper"
                  className="roomWrapper relative flex snap-center snap-always flex-row  px-2 "
                >
                  <div
                    id="roomInnerWrapper"
                    className="roomInnerWrapper no-scrollbar relative flex h-full flex-shrink-0 flex-col gap-0 rounded-md border border-grey-90 px-2 "
                  >
                    <Room entityID={room} key={room} />
                  </div>
                </div>

                <div className="snap-start snap-always ">
                  <CardViewer room={room} />
                </div>
                <div className="w-2 shrink-0 snap-start" />
              </div>
            )}
          </SmallCardDragContext>
        </div>
      </div>
    </>
  );
}
