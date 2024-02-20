"use client";

import { Tab } from "@headlessui/react";
import { NonUndefined } from "@use-gesture/react";
import { useStudioData } from "hooks/useStudioData";
import { Fragment, useCallback, useEffect, useState } from "react";
import { Members } from "./MemberTab";
import { StudioSettings } from "./SettingsTab";
import { SpaceList } from "./SpacesTab";
import { About } from "./AboutTab";
import { ArrowDown, Information } from "components/Icons";
import Link from "next/link";
import { useAuth } from "hooks/useAuth";
import useWindowDimensions from "hooks/useWindowDimensions";
import { ButtonPrimary } from "components/Buttons";
import { LoginOrSignupModal } from "components/LoginModal";
import * as Popover from "@radix-ui/react-popover";
import { joinCodeLocalStorageKey } from "./join/Join";
import { spaceAPI } from "backend/lib/api";
import { WORKER_URL } from "src/constants";
import { useSearchParams } from "next/navigation";

export type Props = {
  data: NonUndefined<ReturnType<typeof useStudioData>["data"]>;
  isAdmin: boolean;
};

const Tabs = { About: About, Spaces: SpaceList, Members: Members } as {
  [key: string]: (props: Props) => React.ReactNode;
};
export function StudioPageContent(props: Props) {
  let { data } = useStudioData(props.data?.id, props.data);
  let { width } = useWindowDimensions();
  let { session } = useAuth();
  let authorized = data?.members_in_studios.find(
    (m) => m.member === session.user?.id
  );
  let [selectedIndex, setSelectedIndex] = useState(
    session.session && authorized ? 1 : 0
  );

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  if (props.isAdmin) Tabs["Settings"] = Settings;
  if (!isClient) return null;
  return (
    <div className="pwa-padding studioWrapper  flex w-full items-stretch sm:h-screen">
      <div className="flex w-full flex-col">
        <StudioBanner {...props} />
        <div className="studio relative mx-auto flex w-full max-w-7xl grow flex-col px-3 sm:flex-row sm:overflow-hidden sm:px-4">
          <Tab.Group
            manual
            selectedIndex={selectedIndex}
            onChange={setSelectedIndex}
          >
            {width > 640 ? (
              <StudioDesktopNav data={props.data} isAdmin={props.isAdmin} />
            ) : (
              <StudioMobileNav data={props.data} isAdmin={props.isAdmin} />
            )}

            <div
              className={`StudioContent flex w-full grow flex-col items-stretch`}
            >
              <Tab.Panels className="StudioTabContent h-full min-h-0 ">
                {Object.values(Tabs).map((T, index) => (
                  <Tab.Panel key={index} className="h-full">
                    <T data={data || props.data} isAdmin={props.isAdmin} />
                  </Tab.Panel>
                ))}
              </Tab.Panels>
            </div>
          </Tab.Group>
        </div>
      </div>
    </div>
  );
}

const TabItem = (props: { name: string }) => (
  <Tab as={Fragment}>
    {({ selected }) => (
      <button
        className={`text-right outline-none ${
          selected
            ? "text-accent-blue font-bold"
            : "text-grey-35 hover:text-accent-blue"
        }`}
      >
        {props.name}
      </button>
    )}
  </Tab>
);

function Settings({ data }: Props) {
  return (
    <>
      <StudioSettings id={data.id} />
    </>
  );
}

const StudioDesktopNav = (props: Props) => {
  let { data } = useStudioData(props.data?.id, props.data);
  let { session } = useAuth();

  return (
    <div className="studioNav border-grey-80 my-6 mr-4 w-64 flex-col justify-between border-r pr-4">
      <div className="flex w-full flex-col gap-2 text-right">
        <h3
          style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
        >
          {data?.name}
        </h3>
        <Tab.List className="StudioTabs flex flex-col gap-2 ">
          {Object.keys(Tabs).map((tab) => (
            <TabItem name={tab} key={tab} />
          ))}
        </Tab.List>
        {session.session ? (
          <Link
            href={`/s/${session.session.username}`}
            className="text-grey-55 hover:text-accent-blue flex items-center justify-end gap-2"
          >
            <ArrowDown className="rotate-90" height={16} width={16} /> home
          </Link>
        ) : null}
      </div>
    </div>
  );
};

const StudioMobileNav = (props: Props) => {
  let { data } = useStudioData(props.data?.id, props.data);
  let { session } = useAuth();

  return (
    <>
      {/* translate3d is necessary to fix a bug in safari where sticky z-index is reordered on scroll */}
      {session.session ? (
        <Link
          href={`/s/${session.session.username}`}
          className="text-grey-55 hover:text-accent-blue z-30 mt-3 flex items-center gap-2 text-sm"
          style={{ transform: "translate3D(0,0,0)" }}
        >
          <ArrowDown className="rotate-90" height={16} width={16} /> home
        </Link>
      ) : null}
      <h3
        style={{ transform: "translate3D(0,0,0)" }}
        className="z-20 -mb-3 mt-2"
      >
        {data?.name}
      </h3>

      <div className="pwa-padding pwa-negative-margin border-grey-80 bg-background sticky top-0  z-10 -mx-3 mb-4 border-b px-3 pb-1">
        <div className=" flex gap-2 pt-4">
          <Tab.List className="StudioTabs flex gap-4">
            {Object.keys(Tabs).map((tab) => (
              <TabItem name={tab} key={tab} />
            ))}
          </Tab.List>
        </div>
      </div>
    </>
  );
};

const LoginButton = () => {
  let [state, setState] = LoginOrSignupModal.useState("closed");
  return (
    <>
      <ButtonPrimary content="Log In" onClick={() => setState("login")} />
      <LoginOrSignupModal state={state} setState={setState} />
    </>
  );
};

const StudioBanner = (props: Props) => {
  let { data, mutate } = useStudioData(props.data?.id, props.data);
  let [joinCode, setJoinCode] = useState<null | string>(null);
  let { session, authToken } = useAuth();
  let query = useSearchParams();
  let joinOnLoad = query?.get("join") === "true";
  let isMember = props.data.members_in_studios.find(
    (m) => m.member === session.user?.id
  );
  let [loginOrSignupState, setLoginOrSignupState] =
    LoginOrSignupModal.useState("closed");
  useEffect(() => {
    let localJoinCode = localStorage.getItem(
      joinCodeLocalStorageKey(props.data.id)
    );
    setJoinCode(localJoinCode);
  }, [props.data.id]);

  const join = useCallback(async () => {
    if (!props.data || !authToken || !joinCode) return;
    let data = await spaceAPI(
      `${WORKER_URL}/space/${props.data?.do_id}`,
      "join",
      {
        authToken,
        code: joinCode,
        bio: "",
      }
    );

    if (data.success) {
      mutate();
    }
  }, [authToken, joinCode, props.data, mutate]);

  useEffect(() => {
    if (joinOnLoad === true) join();
  }, [joinOnLoad, join]);

  if (isMember) return null;
  if (!joinCode)
    return (
      <div className="studioBannerNoInvite flex w-full justify-between gap-3">
        <div>
          You are spectating this studio. Only invited members can comment,
          chat, and make spaces.
        </div>
        {!session.session && <LoginButton />}
      </div>
    );

  return (
    <>
      <LoginOrSignupModal
        state={loginOrSignupState}
        setState={setLoginOrSignupState}
      />
      <div className="studioBanner bg-bg-blue border-grey-80 flex w-screen shrink-0 grow-0 justify-between border-b px-3 pb-0.5 pt-2 text-sm sm:px-4">
        <div className="studioBannerInvite flex w-full items-center justify-center gap-3">
          <div className="text-grey-55 flex items-center gap-2 font-bold">
            You&apos;re invited to join this studio!
            <Popover.Root>
              <Popover.Trigger>
                <button className="pt-[5px]">
                  <Information />
                </button>
              </Popover.Trigger>
              <Popover.Content sideOffset={0}>
                <div className="lightBorder text-grey-55 z-50 max-w-xs rounded-sm bg-white p-2 text-sm font-normal shadow-lg">
                  Members can create new spaces, and comment in spaces within
                  the studio. <br /> However, in order to add or edit cards in
                  spaces you must be invited separately to each space.
                </div>
                <Popover.Close />
              </Popover.Content>
            </Popover.Root>
          </div>
          {session.session ? (
            <ButtonPrimary
              content="Join!"
              onClick={() => {
                join();
              }}
            />
          ) : (
            <ButtonPrimary
              content="Signup or Login to Join!"
              onClick={() => setLoginOrSignupState("signup")}
            />
          )}
        </div>
      </div>
    </>
  );
};
