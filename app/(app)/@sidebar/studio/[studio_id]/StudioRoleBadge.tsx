"use client";

import * as Popover from "@radix-ui/react-popover";
import { NonUndefined } from "@use-gesture/react";
import { joinCodeLocalStorageKey } from "app/(app)/studio/[studio_id]/join/Join";
import { spaceAPI } from "backend/lib/api";
import { ButtonPrimary } from "components/Buttons";
import { GoBackToPageLined, InfoTiny, Information } from "components/Icons";
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
  "flex w-fit items-center gap-1 place-self-end rounded-full border py-[2px] pl-[8px] pr-[4px] text-sm font-bold";

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
      <div>
        <div className="studioRoleBadgeInvite flex w-full flex-row items-center justify-items-center gap-2 font-bold ">
          {isMember ? (
            <div
              className={`bg-bg-blue border-grey-80 text-grey-55 ${BadgeStyles}`}
            >
              Member
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
          ) : joinCode ? (
            <>
              <div
                className={`border-accent-blue text-accent-blue border ${BadgeStyles}`}
              >
                Invited
                <InfoPopover>
                  <p>You&apos;ve been invited to join this Studio!</p>
                  <p>
                    Members can <b> add new Spaces</b>{" "}
                    <b>
                      {!!!data?.allow_members_to_join_spaces ||
                        (data.allow_members_to_join_spaces === undefined &&
                          ", join existing Spaces,")}
                    </b>{" "}
                    and <b>comment on Spaces </b>
                    within the Studio.
                  </p>
                </InfoPopover>
              </div>
              {session.session ? (
                <ButtonPrimary
                  content="Join!"
                  className="!py-[1px] !text-sm"
                  onClick={() => {
                    join(authToken);
                  }}
                />
              ) : (
                <ButtonPrimary
                  content="Join!"
                  className="!py-[1px] !text-sm"
                  onClick={() => setLoginOrSignupState("signup")}
                />
              )}
            </>
          ) : (
            <>
              {" "}
              <div
                className={`${BadgeStyles} border-grey-80 text-grey-55 border`}
              >
                Guest
                <InfoPopover>
                  You&apos;ll need an invite to add or comment on Spaces here.
                </InfoPopover>
              </div>
              {!session.session && <LoginButton small />}
            </>
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
          <InfoTiny />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={8} className="z-20" collisionPadding={24}>
          <div className="lightBorder text-grey-55 flex max-w-xs flex-col gap-2 rounded-sm bg-white p-2 text-xs font-normal shadow-lg">
            {props.children}
          </div>
          <Popover.Close />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
