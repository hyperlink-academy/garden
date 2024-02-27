"use client";

import { NonUndefined } from "@use-gesture/react";
import { useStudioData } from "hooks/useStudioData";
import { useCallback, useEffect, useState } from "react";
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

import { GetStartedTab, useHasGetStartedItems } from "./GettingStartedTab";
import { useStudioTabs } from "app/(app)/@sidebar/studio/[studio_id]/StudioTabs";

export type Props = {
  data: NonUndefined<ReturnType<typeof useStudioData>["data"]>;
  isAdmin: boolean;
};

export type Tabs = "About" | "Spaces" | "Members" | "Settings" | "Get Started";

const TabPanels = (
  props: Props & { setTab: (t: Tabs) => void; currentTab: Tabs }
) => {
  let hasGetStartedItems = useHasGetStartedItems(props);
  switch (props.currentTab) {
    case "Get Started":
      return hasGetStartedItems ? <GetStartedTab {...props} /> : null;
    case "About":
      return <About {...props} />;
    case "Members":
      return <Members {...props} />;
    case "Settings":
      return props.isAdmin ? <Settings {...props} /> : null;
    case "Spaces":
      return <SpaceList {...props} />;
  }
};

export function StudioPageContent(props: Props) {
  let { data } = useStudioData(props.data?.id, props.data);
  let { session } = useAuth();
  let authorized = data?.members_in_studios.find(
    (m) => m.member === session.user?.id
  );
  let [currentTab, setTab] = useStudioTabs(props.data.id);

  let hasGettingStartedItems = useHasGetStartedItems(props);
  useEffect(() => {
    if (currentTab) return;
    setTab(
      hasGettingStartedItems
        ? "Get Started"
        : session.session && authorized
        ? "Spaces"
        : "About"
    );
  }, [
    currentTab,
    hasGettingStartedItems,
    session,
    authorized,
    props.data.id,
    setTab,
  ]);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  if (!isClient) return null;
  return (
    <div className="pwa-padding studioWrapper  flex w-full items-stretch px-3 sm:h-screen sm:px-4">
      <div className="flex w-full flex-col">
        <StudioBanner {...props} />
        <div
          className={`StudioContent flex w-full grow flex-col items-stretch`}
        >
          <div className="no-scrollbar h-full w-full overflow-y-scroll">
            <TabPanels
              data={data || props.data}
              isAdmin={props.isAdmin}
              setTab={setTab}
              currentTab={currentTab}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Settings({ data }: Props) {
  return (
    <>
      <StudioSettings id={data.id} />
    </>
  );
}

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
                  You&apos;re invited to join this Studio!
                  <InfoPopover>
                    <p>
                      Members can <b> add new Spaces</b>, and{" "}
                      <b>comment in Spaces </b>
                      within the Studio.
                    </p>
                    <p>
                      However, you need to <b>join each Space</b> to add or edit
                      cards in them.
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
                You are spectating this Studio!{" "}
                <InfoPopover>
                  You&apos;ll need an invite to add Spaces or comment on Spaces
                  here.
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
