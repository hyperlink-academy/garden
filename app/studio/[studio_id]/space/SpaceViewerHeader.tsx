"use client";
import { ButtonPrimary } from "components/Buttons";
import { ArrowUp } from "components/Icons";
import { LogInModal } from "components/LoginModal";
import { SpaceOptions } from "components/SpaceLayout/Sidebar";
import { SpaceData } from "components/SpacesList";
import { Truncate } from "components/Truncate";
import { useAuth } from "hooks/useAuth";
import { useSpaceID } from "hooks/useReplicache";
import { useSpaceData } from "hooks/useSpaceData";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export const SpaceViewerHeader = (props: {
  spaces: SpaceData[];
  studioName: string;
}) => {
  let { session } = useAuth();
  let params = useParams<{ space_id: string; studio_id: string }>();
  return (
    <div className="spaceHeaderInfo group flex min-w-0 shrink  grow flex-row items-stretch gap-2 rounded-md border border-transparent p-2 pb-0 font-bold hover:border-grey-80">
      <div
        className={`spaceName flex w-full min-w-0 grow justify-between bg-background text-grey-35`}
      >
        <div className="flex flex-col gap-0">
          <div className="flex flex-row gap-2">
            <Link href={`/studio/${params?.studio_id}`}>
              <h3 className="text-base">{props.studioName}</h3>
            </Link>
            <SpaceSwitcher spaces={props.spaces} />
          </div>
          <div className="flex w-full flex-row items-start gap-2 bg-inherit ">
            <SpaceName truncate />
            <SpaceOptions />
          </div>
        </div>
      </div>
      {!session.loggedIn && <LoginButton />}
    </div>
  );
};

const SpaceSwitcher = (props: { spaces: SpaceData[] }) => {
  let params = useParams<{ space_id: string; studio_id: string }>();
  let router = useRouter();
  let activeSpace =
    props.spaces.find((x) => x.id === params?.space_id) || props.spaces[0];
  let spaces = props.spaces.filter((s) => s.archived === activeSpace.archived);
  let index = spaces.findIndex((s) => s.id === params?.space_id);
  return (
    <div className="flex flex-row items-center gap-0.5 text-sm font-normal">
      <button
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
      </button>
      <span>
        <sup>{index + 1}</sup>/<sub>{spaces.length}</sub>
      </span>
      <button
        onClick={() => {
          if (!params) return;
          router.push(
            `/studio/${params.studio_id}/space/${
              spaces[(index + 1) % spaces.length].id
            }`
          );
        }}
      >
        <ArrowUp
          style={{ transform: "rotate(90deg)" }}
          height={16}
          width={16}
        />
      </button>
    </div>
  );
};

export const LoginButton = () => {
  let [logInOpen, setLogInOpen] = useState(false);
  return (
    <>
      <ButtonPrimary
        content="Log In"
        onClick={() => setLogInOpen(!logInOpen)}
      />
      <LogInModal isOpen={logInOpen} onClose={() => setLogInOpen(false)} />
    </>
  );
};

const SpaceName = (props: { truncate?: boolean }) => {
  let spaceID = useSpaceID();
  let { data } = useSpaceData(spaceID);

  return (
    <div
      className={`spaceName flex min-w-0 bg-inherit font-normal text-grey-35`}
    >
      {props.truncate ? (
        <Truncate className="w-full max-w-none overflow-hidden bg-inherit">
          <h2 className="SpaceName whitespace-nowrap font-normal">
            {data?.display_name}
          </h2>
        </Truncate>
      ) : (
        <h3 className="SpaceName whitespace-normal">{data?.display_name}</h3>
      )}
    </div>
  );
};
