"use client";
import { ArrowUp } from "components/Icons";
import { SpaceData } from "components/SpacesList";
import { Truncate } from "components/Truncate";
import { useSpaceData } from "hooks/useSpaceData";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export const SpaceViewerHeader = (props: {
  spaces: SpaceData[];
  space_id: string;
  studioName: string;
}) => {
  let params = useParams<{ space_id: string; studio_id: string }>();
  return (
    <div className="spaceHeaderInfo -mb-1 ml-2 flex min-w-0 shrink grow flex-row items-stretch gap-2 px-3 py-1 font-bold">
      <div className="spaceName bg-background text-grey-35 flex w-full min-w-0 grow justify-between">
        <div className="flex w-full flex-col gap-0">
          <div className="flex flex-row items-center gap-2">
            <Link href={`/studio/${params?.studio_id}`}>
              <h4 className="text-grey-55 hover:text-accent-blue text-sm">
                {props.studioName}
              </h4>
            </Link>
            <SpaceSwitcher spaces={props.spaces} />
          </div>
          <div className="flex w-full flex-row items-center justify-between gap-2 bg-inherit">
            <SpaceName truncate space_id={props.space_id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const SpaceSwitcher = (props: { spaces: SpaceData[] }) => {
  let params = useParams<{ space_id: string; studio_id: string }>();
  let router = useRouter();
  let activeSpace =
    props.spaces.find((x) => x.id === params?.space_id) || props.spaces[0];
  let spaces = props.spaces.filter((s) => s.archived === activeSpace.archived);
  let index = spaces.findIndex((s) => s.id === params?.space_id);
  return (
    <div className="">
      <div className="flex flex-row items-center gap-2 text-sm font-normal">
        <button
          className="text-grey-55 hover:text-accent-blue flex items-center gap-0 "
          onClick={() => {
            if (!params) return;
            router.push(
              `/studio/${params.studio_id}/space/${
                //wrap around index - 1
                spaces[(index - 1 + spaces.length) % spaces.length].id
              }`
            );
          }}
        >
          <ArrowUp
            style={{ transform: "rotate(-90deg)" }}
            height={16}
            width={16}
          />
          prev
        </button>
        {/* <span>

          <sup>{index + 1}</sup>/<sub>{spaces.length}</sub>
        </span> */}
        <button
          className="text-grey-55 hover:text-accent-blue flex items-center gap-0"
          onClick={() => {
            if (!params) return;
            router.push(
              `/studio/${params.studio_id}/space/${
                spaces[(index + 1) % spaces.length].id
              }`
            );
          }}
        >
          next
          <ArrowUp
            style={{ transform: "rotate(90deg)" }}
            height={16}
            width={16}
          />
        </button>
      </div>
    </div>
  );
};

const SpaceName = (props: { truncate?: boolean; space_id: string }) => {
  let { data } = useSpaceData({ space_id: props.space_id });

  return (
    <div className={`spaceName text-grey-35 flex min-w-0 bg-inherit`}>
      {props.truncate ? (
        <Truncate className="w-full max-w-none overflow-hidden bg-inherit">
          <h3 className="SpaceName min-h-[30px] whitespace-nowrap">
            {data?.display_name}
          </h3>
        </Truncate>
      ) : (
        <h3 className="SpaceName min-h-[30px] whitespace-normal">
          {data?.display_name}
        </h3>
      )}
    </div>
  );
};
