"use client";
import { ButtonPrimary } from "components/Buttons";
import { ArrowUp } from "components/Icons";
import { LoginOrSignupModal } from "components/LoginModal";
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
    <div className="spaceHeaderInfo group group -mb-1 ml-2 flex min-w-0 shrink grow flex-row items-stretch gap-2 rounded-md border border-transparent px-3 py-1 font-bold hover:border-grey-80 ">
      <div
        className={`spaceName flex w-full min-w-0 grow justify-between bg-background text-grey-35`}
      >
        <div className="flex w-full flex-col gap-0">
          <div className="flex flex-row items-center gap-2">
            <Link href={`/studio/${params?.studio_id}`}>
              <h4 className="text-sm text-grey-55 hover:text-accent-blue ">
                {props.studioName}
              </h4>
            </Link>
            <SpaceSwitcher spaces={props.spaces} />
          </div>
          <div className="flex w-full flex-row items-center justify-between gap-2 bg-inherit ">
            <SpaceName truncate />
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
    <div className="hidden group-hover:block">
      <div className="flex flex-row items-center gap-2 text-sm font-normal">
        <button
          className="flex items-center gap-0 text-grey-55 hover:text-accent-blue "
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
          className="flex items-center gap-0 text-grey-55 hover:text-accent-blue"
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

export const LoginButton = () => {
  let [state, setState] = LoginOrSignupModal.useState("closed");
  return (
    <>
      <ButtonPrimary content="Log In" onClick={() => setState("login")} />
      <LoginOrSignupModal state={state} setState={setState} />
    </>
  );
};

const SpaceName = (props: { truncate?: boolean }) => {
  let spaceID = useSpaceID();
  let { data } = useSpaceData(spaceID);

  return (
    <div className={`spaceName flex min-w-0 bg-inherit text-grey-35`}>
      {props.truncate ? (
        <Truncate className="w-full max-w-none overflow-hidden bg-inherit">
          <h3 className="SpaceName whitespace-nowrap">{data?.display_name}</h3>
        </Truncate>
      ) : (
        <h3 className="SpaceName whitespace-normal">{data?.display_name}</h3>
      )}
    </div>
  );
};
