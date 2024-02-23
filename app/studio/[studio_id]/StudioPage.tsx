"use client";

import { Tab } from "@headlessui/react";
import { NonUndefined } from "@use-gesture/react";
import { useStudioData } from "hooks/useStudioData";
import { Fragment, ReactNode, useCallback, useEffect, useState } from "react";
import { Members } from "./MemberTab";
import { StudioSettings } from "./SettingsTab";
import { SpaceList } from "./SpacesTab";
import { About } from "./AboutTab";
import { ArrowDown, GoBackToPageLined, Information } from "components/Icons";
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
import { useToaster } from "components/Smoke";
import { uuidToBase62 } from "src/uuidHelpers";

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
    <div className="pwa-padding studioWrapper  flex w-full items-stretch px-3 sm:h-screen sm:px-4">
      <div className="flex w-full flex-col">
        <StudioBanner {...props} />
        <div className="studio relative mx-auto flex w-full max-w-7xl grow flex-col sm:flex-row sm:overflow-hidden ">
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
  let toaster = useToaster();

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

const JoinSuccessToast = {
  text: "Yes! You've joined this Studio!",
  type: "success",
  icon: null,
} as const;

const StudioBanner = (props: Props) => {
  let { data, mutate } = useStudioData(props.data?.id, props.data);
  let [joinCode, setJoinCode] = useState<null | string>(null);
  let { session, authToken } = useAuth();
  let query = useSearchParams();
  let joinOnLoad = query?.get("join") === "true";
  let isMember = data?.members_in_studios.find(
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
  let toaster = useToaster();
  const join = useCallback(
    async (a: typeof authToken) => {
      if (!props.data || !a || !joinCode) return;
      let data = await spaceAPI(
        `${WORKER_URL}/space/${props.data?.do_id}`,
        "join",
        {
          authToken: a,
          code: joinCode,
        }
      );

      if (data.success) {
        mutate();
        toaster(JoinSuccessToast);
      }
    },
    [joinCode, props.data, mutate, toaster]
  );

  useEffect(() => {
    if (joinOnLoad === true) join(authToken);
  }, [joinOnLoad, join, authToken]);

  if (isMember) return null;

  return (
    <>
      <LoginOrSignupModal
        state={loginOrSignupState}
        setState={setLoginOrSignupState}
        redirectTo={`/studio/${uuidToBase62(props.data.id)}?join=true`}
        onLogin={(s) => {
          if (
            s.authToken &&
            !props.data.members_in_studios.find((m) => m.member === s.id)
          ) {
            join(s.authToken);
          }
        }}
      />

      <div
        className={`studioBanner lightBorder text-grey-55 mx-auto mt-4 flex w-full max-w-7xl shrink-0 grow-0 border px-2 py-1 text-sm sm:px-4 ${
          joinCode ? " bg-bg-blue" : "bg-grey-90 "
        }`}
      >
        <div className="studioBannerInvite flex w-full items-start justify-items-center gap-0 font-bold sm:flex-row sm:items-center sm:gap-2">
          {joinCode ? (
            <>
              <div className="mt-[4px] shrink-0 grow-0 sm:mt-0">
                <Link
                  className="hover:text-accent-blue "
                  href={`/studio/${uuidToBase62(
                    props.data.id
                  )}/join?code=${joinCode}`}
                >
                  <GoBackToPageLined />
                </Link>
              </div>
              <div className="flex w-full flex-col  items-center justify-center gap-1 sm:flex-row sm:gap-6">
                <div className="flex items-center gap-1 ">
                  You&apos;re invited to join this studio!
                  <InfoPopover>
                    <p>
                      Members can <b> create new spaces</b>, and{" "}
                      <b>comment in spaces </b>
                      within the studio.
                    </p>
                    <p>
                      However, you need to <b>join to each space</b> in order to
                      add or edit cards in them.
                    </p>
                  </InfoPopover>
                </div>
                {session.session ? (
                  <ButtonPrimary
                    content="Join!"
                    onClick={() => {
                      join(authToken);
                    }}
                  />
                ) : (
                  <ButtonPrimary
                    content="Signup or Login to Join!"
                    onClick={() => setLoginOrSignupState("signup")}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="studioBannerNoInvite z-30 flex w-full items-center justify-between gap-6 sm:justify-center">
              <div className="flex items-center gap-1 ">
                You are spectating this studio!{" "}
                <InfoPopover>
                  You need an invite to add spaces or make comments here!
                </InfoPopover>
              </div>
              {!session.session && <LoginButton />}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const InfoPopover = (props: { children: React.ReactNode }) => {
  return (
    <Popover.Root>
      <Popover.Trigger>
        <button className="flex place-items-center ">
          <Information />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={2} className="z-50">
          <div className="lightBorder text-grey-55 flex max-w-xs flex-col gap-2 rounded-sm bg-white p-2 text-xs font-normal shadow-lg">
            {props.children}
          </div>
          <Popover.Close />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
