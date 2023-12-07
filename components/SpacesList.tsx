import { db, useMutations } from "hooks/useReplicache";
import Link from "next/link";
import { useState } from "react";
import { ButtonLink } from "./Buttons";
import { DoorImage } from "./Doors";
import { Information, Settings } from "./Icons";
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
      <div
        className={`spacesList flex flex-wrap  ${props?.small ? "gap-4" : "gap-6 py-2"
          }`}
      >
        {props.spaces?.map((a) => {
          return (
            <div
              key={a.do_id}
              className={`${props.small
                  ? ""
                  : "min-w-80 flex-1 basis-80 sm:last:max-w-[calc(50%-12px)]"
                }`}
            >
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
  console.log(data);
  let spaceEntity = db.useUniqueAttribute("space/id", props.do_id);
  let unreads = data?.user_space_unreads?.find(
    (u) => u.user === session?.session?.studio
  );

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
      <div className="smallSpaceCard group relative flex min-h-[82px]">
        <div className="ml-8 mt-6">
          <div
            className="smallSpaceCardContent lightBorder flex w-80 shrink-0 flex-col gap-0 bg-white py-2 pl-10 pr-3"
            style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
          >
            <div className="flex justify-between gap-2">
              {/* this may never show 'space deleted' but here same as big space card in case */}
              <h3 className={!data?.display_name ? "italic text-grey-55" : ""}>
                {data?.display_name || "space deleted"}
              </h3>
              <div className="">
                {props.editable &&
                  (data?.owner?.username == session.session?.username ? (
                    <EditSpaceButton
                      onEdit={props.onEdit}
                      spaceID={props.do_id}
                      owner={data?.owner?.username}
                    />
                  ) : (
                    <SpaceInfoButton
                      studio={data?.owner?.username}
                      name={data?.display_name}
                      description={data?.description}
                    />
                  ))}
              </div>
            </div>
            {data?.start_date &&
              data?.end_date &&
              data?.start_date <= now &&
              data?.end_date >= now ? (
              <div className="text-sm italic text-grey-35">
                <div>
                  ends{" "}
                  {new Date(data.end_date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </div>
              </div>
            ) : data?.start_date && data?.start_date > now ? (
              <div className="text-sm italic text-grey-35">
                <div>
                  starts{" "}
                  {new Date(data.start_date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div className="smallSpaceCardIcon absolute left-0 top-0">
          <DoorImage
            small
            width="64"
            display_name={data?.display_name}
            image={data?.image}
            default_space_image={data?.default_space_image}
            glow={!!unreads && !!authorized && unreads.unreads > 0}
          />
        </div>
      </div>
    );

  return (
    <div className="largeSpaceCard group relative flex w-full">
      <div className="largeSpaceCardIcon absolute left-0 top-0">
        <DoorImage
          width="96"
          display_name={data?.display_name}
          image={data?.image}
          default_space_image={data?.default_space_image}
          glow={!!unreads && !!authorized && unreads.unreads > 0}
        />
      </div>
      <div className="ml-16 mt-10 w-full">
        <div className="largeSpaceCardContent lightBorder flex min-h-[160px] w-full shrink-0 flex-col gap-0 bg-white py-4 pl-12 pr-4">
          <div className="largeSpaceCardDetails flex grow flex-col gap-1">
            <div
              className="flex justify-between gap-4"
              style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
            >
              <h3 className={!data?.display_name ? "italic text-grey-55" : ""}>
                {data?.display_name || "space deleted"}
              </h3>
              <div className="">
                {data?.owner?.username == session.session?.username ? (
                  <EditSpaceButton
                    onEdit={props.onEdit}
                    spaceID={props.do_id}
                    owner={data?.owner?.username}
                  />
                ) : (
                  <SpaceInfoButton
                    studio={data?.owner?.username}
                    name={data?.display_name}
                    description={data?.description}
                  />
                )}
              </div>
            </div>
            <p>{data?.description}</p>
          </div>

          {data?.start_date &&
            data?.end_date &&
            data?.start_date <= now &&
            data?.end_date >= now ? (
            <div className="mt-2 text-sm italic text-grey-35">
              ends{" "}
              {data?.end_date &&
                new Date(data?.end_date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "UTC",
                })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export const EditSpaceButton = (props: {
  spaceID: string;
  owner?: string;
  onEdit?: () => void;
}) => {
  let [open, setOpen] = useState(false);
  let { authorized } = useMutations();
  let { session } = useAuth();
  if (
    !props.owner ||
    authorized === false ||
    session.session?.username !== props.owner
  ) {
    return null;
  } else
    return (
      <>
        <button
          onClick={(e) => {
            setOpen(true);
            e.preventDefault();
          }}
          className="text-grey-55 hover:text-accent-blue"
        >
          <Settings />
        </button>

        <div className="text-grey-55 hover:text-accent-blue">
          <EditSpaceModal
            onSubmit={props.onEdit}
            spaceID={props.spaceID}
            open={open}
            onClose={() => setOpen(false)}
            onDelete={() => setOpen(false)}
          />
        </div>
      </>
    );
};

const SpaceInfoButton = (props: {
  studio?: string;
  name?: string | null;
  description?: string | null;
}) => {
  let [open, setOpen] = useState(false);

  let studio = props.studio;
  let name = props.name;
  let description = props.description;

  if (!studio || !name) return null;

  return (
    <>
      <button
        onClick={(e) => {
          setOpen(true);
          e.preventDefault();
        }}
        className="text-grey-55 hover:text-accent-blue"
      >
        <Information />
      </button>

      <Modal header={name} open={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            {description ? (
              <div>{description}</div>
            ) : (
              <div>
                <p>
                  <em className="text-grey-55">no description</em>
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-2 italic text-grey-55">
            <span>created by</span>
            <Link href={`/s/${studio}`} className="">
              <ButtonLink content={studio} />
            </Link>
          </div>
        </div>
      </Modal>
    </>
  );
};
