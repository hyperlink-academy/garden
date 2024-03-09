"use client";

import * as Popover from "@radix-ui/react-popover";
import { NonUndefined } from "@use-gesture/react";
import { joinCodeLocalStorageKey } from "app/(app)/studio/[studio_id]/join/Join";
import { spaceAPI } from "backend/lib/api";
import { ButtonPrimary } from "components/Buttons";
import { GoBackToPageLined, Information } from "components/Icons";
import { LoginOrSignupModal, LoginButton } from "components/LoginModal";
import { useToaster } from "components/Smoke";
import { useAuth } from "hooks/useAuth";
import { useStudioData } from "hooks/useStudioData";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { WORKER_URL } from "src/constants";
import { uuidToBase62 } from "src/uuidHelpers";

export type Props = {
  data: NonUndefined<ReturnType<typeof useStudioData>["data"]>;
  isAdmin: boolean;
};

const BadgeStyles =
  "flex w-fit items-center gap-2 place-self-end rounded-full border py-[2px] pl-[8px] pr-[4px] text-xs font-bold";

const JoinSuccessToast = {
  text: "Yes! You've joined this Studio!",
  type: "success",
  icon: null,
} as const;

export const StudioRoleBadge = (props: Props) => {
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
      <div>
        <div className="studioBannerInvite flex w-full items-start justify-items-center gap-0 font-bold sm:flex-row sm:items-center sm:gap-2">
          {isMember ? (
            <div>hi</div>
          ) : joinCode ? (
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
              <div className={`${BadgeStyles}`}>
                Invited
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
            </>
          ) : session.loggedIn ? (
            <div className={`${BadgeStyles}`}>
              Guest
              <InfoPopover>
                You&apos;ll need an invite to add Spaces or comment on Spaces
                here.
              </InfoPopover>
            </div>
          ) : null}
          {!session.session && <LoginButton small />}
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
