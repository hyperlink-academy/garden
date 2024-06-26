import { useMutations } from "hooks/useReplicache";
import Link from "next/link";
import { DoorImage } from "./Doors";
import { RoomMember } from "./Icons";
import { useAuth } from "hooks/useAuth";
import { spacePath } from "hooks/utils";
export type { SpaceData } from "backend/routes/get_space_data";
import type { SpaceData } from "backend/routes/get_space_data";
import { getCurrentDate } from "src/utils";

export const SpaceList = (props: {
  spaces: Array<SpaceData>;
  onEdit?: () => void;
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
              <SpaceCard onEdit={props.onEdit} {...a} editable={true} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SpaceCard = (
  props: {
    editable?: boolean;
    onEdit?: () => void;
  } & SpaceData
) => {
  let data = props;
  if (!data.owner) return <BaseSpaceCard {...props} />;
  return (
    <Link
      href={`${spacePath({
        studio: data.owner.username,
        id: data.id,
        display_name: data.display_name || "",
      })}`}
    >
      <BaseSpaceCard {...props} />
    </Link>
  );
};

export const BaseSpaceCard = (props: Parameters<typeof SpaceCard>[0]) => {
  let { session } = useAuth();

  let data = props;
  let unreads = data?.user_space_unreads?.find(
    (f) => f.user === session.user?.id
  )?.unreads;

  return (
    <div className="largeSpaceCard group relative flex w-full">
      <div className="largeSpaceCardIcon absolute left-0 top-0">
        <DoorImage
          width="64"
          display_name={data?.display_name}
          image={data?.image}
          default_space_image={data?.default_space_image}
          glow={!!unreads && unreads > 0}
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

export function SmallSpaceCard(props: Parameters<typeof SpaceCard>[0]) {
  let data = props;
  let { session } = useAuth();
  let unreads = data?.user_space_unreads?.find(
    (f) => f.user === session.user?.id
  )?.unreads;
  return (
    <div className="group relative pl-3 pt-4 w-full">
      <div className="group flex w-full lightBorder flex-col pl-6 p-2">
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
        <div className=" flex items-center gap-1 place-self-end text-sm italic text-grey-55">
          <RoomMember />
          {data.owner.username}{" "}
          {data.members_in_spaces?.length > 1 && (
            <div>+ {data.members_in_spaces?.length - 1}</div>
          )}
        </div>
        <div className="absolute left-0 top-0">
          <DoorImage
            width="32"
            display_name={data?.display_name}
            image={data?.image}
            default_space_image={data?.default_space_image}
            glow={!!unreads && unreads > 0}
          />
        </div>
      </div>
    </div>
  );
}
