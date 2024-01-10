import { db, useMutations } from "hooks/useReplicache";
import Link from "next/link";
import { useState } from "react";
import { ButtonLink } from "./Buttons";
import { DoorImage } from "./Doors";
import { Information, RoomMember, Settings } from "./Icons";
import { useAuth } from "hooks/useAuth";
import { spacePath } from "hooks/utils";
import { EditSpaceModal } from "./CreateSpace";
import { useSpaceData } from "hooks/useSpaceData";
export type { SpaceData } from "backend/routes/get_space_data";
import type { SpaceData } from "backend/routes/get_space_data";
import { getCurrentDate } from "src/utils";
import { Modal } from "./Modal";

export const SpaceList = (props: {
  spaces: Array<SpaceData>;
  onEdit?: () => void;
  small?: boolean;
}) => {
  return (
    <div>
      <style jsx>{`
        @media (max-width: 360px) {
          .spacesList {
            place-content: space-between;
            gap: 0;
          }
        }
      `}</style>
      <div className=" homeSpaceList grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
        {props.spaces?.map((a) => {
          return (
            <div key={a.do_id}>
              <SpaceCard
                onEdit={props.onEdit}
                small={props.small}
                {...a}
                editable={true}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SpaceCard = (
  props: {
    small?: boolean;
    editable?: boolean;
    onEdit?: () => void;
  } & SpaceData
) => {
  let { data } = useSpaceData(props.do_id, props);
  return (
    <Link href={`${spacePath(data?.owner?.username, data?.name || "")}`}>
      <BaseSpaceCard {...props} />
    </Link>
  );
};

export const BaseSpaceCard = (props: Parameters<typeof SpaceCard>[0]) => {
  let { session } = useAuth();
  let { authorized } = useMutations();
  let now = getCurrentDate();

  let { data } = useSpaceData(props.do_id, props);
  let unreads = data?.user_space_unreads?.find(
    (f) => f.user === session.user?.id
  )?.unreads;

  let duration_days = null;
  // calculate duration, in days
  // add extra +1 day to account for start and end dates
  if (data?.start_date && data?.end_date) {
    let start = new Date(data.start_date);
    let end = new Date(data.end_date);
    let start_timestamp = start.getTime();
    let end_timestamp = end.getTime();
    let delta = Math.abs(end_timestamp - start_timestamp) / 1000;
    duration_days = Math.floor(delta / 86400) + 1;
  }

  if (props.small)
    return (
      <div className="smallSpaceCard relative flex min-h-[82px] w-full">
        <div className="ml-8 mt-6 w-full">
          <div
            className="smallSpaceCardContent lightBorder flex w-full shrink-0 grow flex-col gap-0 bg-white py-2 pl-10 pr-3"
            style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
          >
            <div className="flex justify-between gap-2">
              {/* this may never show 'space deleted' but here same as big space card in case */}
              <div
                className={`font-bold text-grey-55 ${
                  !data?.display_name ? "italic text-grey-55" : ""
                }`}
              >
                {data?.display_name || "space deleted"}
              </div>
            </div>
          </div>
        </div>
        <div className="smallSpaceCardIcon absolute left-0 top-0">
          <DoorImage
            small
            width="64"
            display_name={data?.display_name}
            image={data?.image}
            default_space_image={data?.default_space_image}
            glow={!!unreads && !!authorized && unreads > 0}
          />
        </div>
      </div>
    );

  return (
    <div className="largeSpaceCard group relative flex w-full">
      <div className="largeSpaceCardIcon absolute left-0 top-0">
        <DoorImage
          width="64"
          display_name={data?.display_name}
          image={data?.image}
          default_space_image={data?.default_space_image}
          glow={!!unreads && !!authorized && unreads > 0}
        />
      </div>
      <div className="ml-6 mt-7 w-full">
        <div className="largeSpaceCardContent lightBorder flex min-h-[124px] w-full shrink-0 flex-col bg-white  py-3 pl-[52px] pr-4">
          <div className="largeSpaceCardDetails flex grow flex-col gap-1">
            <div
              className="flex justify-between gap-4"
              style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
            >
              <div
                className={
                  !data?.display_name ? "italic text-grey-55" : " font-bold"
                }
              >
                {data?.display_name || "space deleted"}
              </div>
            </div>
          </div>
          {data && data.owner ? (
            <div className=" flex items-center gap-1 place-self-end text-sm italic text-grey-55">
              <RoomMember />
              {data.owner.username}{" "}
              {data.members_in_spaces?.length > 1 && (
                <div>+ {data.members_in_spaces?.length - 1}</div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
