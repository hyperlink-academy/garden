import { useIndex, useMutations } from "hooks/useReplicache";
import Link from "next/link";
import { useState } from "react";
import { ButtonLink } from "./Buttons";
import { DoorImage } from "./Doors";
import { Information, SettingsStudio } from "./Icons";
import { Modal } from "./Layout";
import { useAuth } from "hooks/useAuth";
import { spacePath } from "hooks/utils";
import { EditSpaceModal } from "./CreateSpace";
import { useSpaceData } from "hooks/useSpaceData";
export type { SpaceData } from "backend/routes/get_space_data";
import type { SpaceData } from "backend/routes/get_space_data";

export const SpaceList = (props: { spaces: Array<SpaceData> }) => {
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
      <div className="spacesList grid grid-cols-[repeat(auto-fill,148px)] justify-between gap-4">
        {props.spaces?.map((a) => {
          return <Space {...a} key={a.do_id} />;
        })}
      </div>
    </div>
  );
};

const Space = (props: SpaceData) => {
  let { session } = useAuth();
  let { authorized } = useMutations();

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
    <div className="flex w-min flex-col gap-4">
      <div className="-ml-2 grid grid-cols-[max-content,max-content] items-end gap-1 ">
        <Link href={`${spacePath(data?.owner.username, data?.name || "")}`}>
          <DoorImage
            display_name={data?.display_name}
            image={data?.image}
            default_space_image={data?.default_space_image}
            glow={!!unreads && !!authorized && unreads.value > 0}
          />
        </Link>
        <div className="flex w-[20px] flex-col gap-4 pb-[92px]">
          {data?.owner.username == session.session?.username ? (
            <EditSpaceButton
              spaceID={props.do_id}
              owner={data?.owner.username}
            />
          ) : (
            <SpaceInfo
              studio={data?.owner.username}
              name={data?.display_name}
              description={data?.description}
            />
          )}
        </div>
      </div>

      <div className="">
        <div className="ml-2 w-full origin-top-left skew-y-[-30deg] scale-x-90 scale-y-110">
          <div className="flex flex-col gap-2">
            <h3
              style={{
                overflowWrap: "anywhere",
              }}
              className="text-xl"
            >
              {data?.display_name}
            </h3>
            {data?.start_date ? (
              <div className="text-sm text-grey-35">
                <div>
                  ❇️ <strong>{data?.start_date}</strong>
                </div>
                {duration_days ? (
                  <div>
                    🗓 <strong>{duration_days} days</strong>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
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
          {/* <ButtonLink content="edit" onClick={() => setOpen(true)} /> */}
          <ButtonLink
            content=""
            icon={<SettingsStudio />}
            onClick={() => setOpen(true)}
          />
        </a>
        <EditSpaceModal
          spaceID={props.spaceID}
          open={open}
          onClose={() => setOpen(false)}
          onDelete={() => setOpen(false)}
        />
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
      <a className="-rotate-3 skew-y-[-30deg] scale-x-75 scale-y-110">
        <ButtonLink
          content=""
          icon={<Information />}
          onClick={() => setOpen(true)}
        />
      </a>
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-4 ">
          <h3>{name}</h3>
          {description ? (
            <div>{description}</div>
          ) : (
            <div>
              <p>
                <em>no description</em>
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <span>created by:</span>
            <Link href={`/s/${studio}`} className="">
              <ButtonLink content={studio} />
            </Link>
          </div>
        </div>
      </Modal>
    </>
  );
};
