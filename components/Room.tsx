import { useIndex } from "hooks/useReplicache";
import { usePreserveScroll } from "hooks/utils";
import { useEffect, useState } from "react";
import { CalendarRoom } from "./CalendarRoom";
import { CardCollection } from "./CardCollection";
import { Discussion } from "./CardView/Discussion";
import { Desktop } from "./Desktop";
import { GoToTop, MoreOptionsTiny } from "./Icons";
import { SearchRoom } from "./SearchRoom";
import { EditRoomModal } from "./SpaceLayout/Sidebar/RoomListLayout";
import { RenderedText } from "./Textarea/RenderedText";

export const Room = (props: { entityID: string | null }) => {
  let roomType = useIndex.eav(props.entityID, "room/type");
  let roomDescription = useIndex.eav(props.entityID, "room/description");
  let roomName = useIndex.eav(props.entityID, "room/name");
  let { ref } = usePreserveScroll<HTMLDivElement>(props.entityID);

  const [isRoomEditOpen, setIsRoomEditOpen] = useState(false);
  const [isRoomDescriptionVisible, setIsRoomDescriptionVisible] =
    useState(true);
  const [
    isToggleableRoomDescriptionHidden,
    setIsToggleableRoomDescriptionHidden,
  ] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target.id === "roomDescription") {
          setIsRoomDescriptionVisible(entry.isIntersecting);
          setIsToggleableRoomDescriptionHidden(true);
        }
      });
    });
    let roomDescription = document.getElementById("roomDescription");
    if (!roomDescription) return;
    observer.observe(roomDescription);
    return () => {
      observer.disconnect();
    };
  }, []);

  if (props.entityID === "search") return <SearchRoom />;
  if (props.entityID === "calendar") return <CalendarRoom />;

  const handleGoToTopClick = () => {
    const scrollContainer = document.getElementById("roomScrollContainer");
    if (!scrollContainer) return;
    const initialPosition = scrollContainer.scrollTop;
    const step = (timestamp: number) => {
      const progress = (timestamp - startTime) / duration;
      const scrollTop = initialPosition * (1 - progress);
      scrollContainer.scrollTop = scrollTop;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    const duration = 300; // milliseconds
    const startTime = performance.now();
    window.requestAnimationFrame(step);
  };

  const toggleDescriptionVisibility = () => {
    if (!isRoomDescriptionVisible) {
      setIsToggleableRoomDescriptionHidden(!isToggleableRoomDescriptionHidden);
    }
  };

  return (
    <div
      id="roomScrollContainer"
      ref={ref}
      className="no-scrollbar m-2 flex h-full w-[336px] flex-col gap-1 overflow-x-hidden overflow-y-scroll text-sm sm:m-4"
    >
      {/* Room Name and Description */}
      <div className="sticky top-0 z-10">
        <div className="flex justify-between bg-background text-lg font-bold text-grey-35">
          <p
            className={
              !isRoomDescriptionVisible ? "mb-2 cursor-pointer" : "mb-2"
            }
            onClick={toggleDescriptionVisibility}
          >
            {roomName?.value}
          </p>
          {isRoomDescriptionVisible || !isToggleableRoomDescriptionHidden ? (
            <div className=" roomListItemSettings flex w-5 shrink-0 place-content-center pt-0.5">
              <button
                onClick={() => setIsRoomEditOpen(true)}
                className={` rounded-md border border-transparent pt-[1px] hover:border-white`}
              >
                <MoreOptionsTiny />
              </button>
            </div>
          ) : (
            <button onClick={handleGoToTopClick}>
              <GoToTop />
            </button>
          )}
        </div>
        {!isRoomDescriptionVisible && !isToggleableRoomDescriptionHidden && (
          <div id="roomDescription2" className="-mt-0 bg-background">
            <RenderedText
              style={{
                whiteSpace: "pre-wrap",
                fontFamily: "inherit",
                width: "100%",
              }}
              className="mb-2 text-sm text-grey-35"
              text={roomDescription?.value || ""}
            />
            <hr className="sticky top-9 z-10 mb-1 text-grey-80" />
          </div>
        )}
      </div>
      <div id="roomDescription" className="invisible"></div>
      <div id="roomDescriptionX" className="-mt-2">
        {/* <p className="text-sm text-grey-35">{roomDescription?.value}</p> */}
        <RenderedText
          className="text-sm text-grey-35"
          id="roomDescriptionY"
          style={{
            whiteSpace: "pre-wrap",
            fontFamily: "inherit",
            width: "100%",
          }}
          text={roomDescription?.value || ""}
        />
      </div>
      {isToggleableRoomDescriptionHidden && (
        <hr className="sticky top-9 z-10 mb-1 text-grey-80" />
      )}

      {/* per-room wrappers + components */}
      {props.entityID ? (
        roomType?.value === "collection" ? (
          <div className="flex min-h-[calc(100vh-132px)] flex-col gap-2">
            <CardCollection
              filterable
              entityID={props.entityID}
              attribute="desktop/contains"
            />
          </div>
        ) : roomType?.value === "chat" ? (
          <div className="flex h-full flex-col">
            <Discussion entityID={props.entityID} isRoom={true} />
          </div>
        ) : (
          <div className="relative flex flex-col">
            <Desktop entityID={props.entityID} />
            <div className="desktopBackground absolute h-full w-full" />
          </div>
        )
      ) : null}
      <EditRoomModal
        open={isRoomEditOpen}
        onClose={() => setIsRoomEditOpen(false)}
        currentRoom={props.entityID}
      />
    </div>
  );
};
