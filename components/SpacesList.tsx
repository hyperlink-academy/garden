import { useIndex, useMutations } from "hooks/useReplicache";
import Link from "next/link";
import { useState } from "react";
import { ButtonLink } from "./Buttons";
import { DoorImage } from "./Doors";
import { Information, Settings } from "./Icons";
import { Modal } from "./Layout";
import { useAuth } from "hooks/useAuth";
import { spacePath } from "hooks/utils";
import { EditSpaceModal } from "./CreateSpace";
import { useSpaceData } from "hooks/useSpaceData";
export type { SpaceData } from "backend/routes/get_space_data";
import type { SpaceData } from "backend/routes/get_space_data";
import { SpaceStatus } from "./SpaceLayout/Sidebar";
import { getCurrentDate } from "src/utils";

export const SpaceList = (props: {
  spaces: Array<SpaceData>;
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
        className={`spacesList flex flex-wrap  ${
          props?.small ? "gap-4" : "gap-6 py-2"
        }`}
      >
        {props.spaces?.map((a) => {
          return <SpaceCard small={props.small} {...a} key={a.do_id} />;
        })}
      </div>
    </div>
  );
};

export const SpaceCard = (props: { small?: boolean } & SpaceData) => {
  let { session } = useAuth();
  let { authorized } = useMutations();
  let now = getCurrentDate();

  let { data } = useSpaceData(props.do_id, props);
  let spaceEntity = useIndex.ave("space/id", props.do_id);
  let unreads = useIndex.eav(
    spaceEntity?.entity || null,
    "space/unread-notifications"
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

  return (
    <>
      {props.small ? (
        <div className="smallSpaceCard group relative min-h-[82px]">
          <Link href={`${spacePath(data?.owner?.username, data?.name || "")}`}>
            <div className="smallSpaceCardIcon absolute left-0 top-0 z-10">
              <DoorImage
                small
                width="64"
                display_name={data?.display_name}
                image={data?.image}
                default_space_image={data?.default_space_image}
                glow={!!unreads && !!authorized && unreads.value > 0}
              />
            </div>
            <div className="ml-8 mt-6">
              <div className="smallSpaceCardContent lightBorder flex w-64 shrink-0 flex-col gap-0 bg-white py-2 pl-10 pr-3 ">
                <div className="flex justify-between gap-2">
                  <h3>{data?.display_name}</h3>
                  <div className="">
                    {data?.owner?.username == session.session?.username ? (
                      <EditSpaceButton
                        spaceID={props.do_id}
                        owner={data?.owner?.username}
                      />
                    ) : (
                      <SpaceInfo
                        studio={data?.owner?.username}
                        name={data?.display_name}
                        description={data?.description}
                      />
                    )}
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
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </Link>
        </div>
      ) : (
        <div className="largeSpaceCard group relative w-full">
          <Link href={`${spacePath(data?.owner?.username, data?.name || "")}`}>
            <div className="largeSpaceCardIcon absolute left-0 top-0 z-10">
              <DoorImage
                width="96"
                display_name={data?.display_name}
                image={data?.image}
                default_space_image={data?.default_space_image}
                glow={!!unreads && !!authorized && unreads.value > 0}
              />
            </div>
            <div className="ml-16 mt-10">
              <div className="largeSpaceCardContent lightBorder flex min-h-[160px] w-full shrink-0 flex-col gap-0 bg-white py-4 pl-12 pr-3 ">
                <div className="largeSpaceCardDetails flex grow flex-col gap-1">
                  <div className="flex justify-between gap-2">
                    <h3>{data?.display_name}</h3>
                    <div className="">
                      {data?.owner?.username == session.session?.username ? (
                        <EditSpaceButton
                          spaceID={props.do_id}
                          owner={data?.owner?.username}
                        />
                      ) : (
                        <SpaceInfo
                          studio={data?.owner?.username}
                          name={data?.display_name}
                          description={data?.description}
                        />
                      )}
                    </div>
                  </div>{" "}
                  <p>{data?.description}</p>
                </div>

                <div className="mt-2 text-sm italic text-grey-35">
                  ends{" "}
                  {data?.end_date &&
                    new Date(data?.end_date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}
    </>
  );
};
export const EditSpaceButton = (props: { spaceID: string; owner?: string }) => {
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
        <a>
          <button
            onClick={(e) => {
              setOpen(true);
              e.preventDefault();
            }}
            className="text-grey-55 opacity-0 hover:text-accent-blue group-hover:opacity-100"
          >
            <Settings />
          </button>
          {/* <ButtonLink content="edit" onClick={() => setOpen(true)} /> */}
        </a>

        <div className="text-grey-55 opacity-0 hover:text-accent-blue group-hover:opacity-100">
          <EditSpaceModal
            spaceID={props.spaceID}
            open={open}
            onClose={() => setOpen(false)}
            onDelete={() => setOpen(false)}
          />
        </div>
      </>
    );
};

const SpaceInfo = (props: {
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
      <a>
        <button
          onClick={(e) => {
            setOpen(true);
            e.preventDefault();
          }}
          className="text-grey-55 opacity-0 hover:text-accent-blue group-hover:opacity-100"
        >
          <Information />
        </button>
      </a>
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-4 ">
          <div className="flex flex-col gap-1 ">
            <h3>{name}</h3>
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
