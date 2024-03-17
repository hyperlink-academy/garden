"use client";
import { CardViewer } from "components/CardViewerContext";
import { useEffect, useState } from "react";
import useWindowDimensions from "hooks/useWindowDimensions";
import { Room } from "components/Room";
import { PresenceHandler } from "components/PresenceHandler";
import { useSpaceSyncState } from "hooks/useSpaceSyncState";
import { WORKER_URL } from "src/constants";
import { Help, InfoTiny, Information, Settings } from "components/Icons";
import { useAuth } from "hooks/useAuth";
import { ButtonPrimary } from "components/Buttons";
import Link from "next/link";
import { HelpModal } from "components/HelpCenter";
import { useSpaceShortcuts } from "hooks/useSpaceShortcuts";
import { SpaceData } from "components/SpacesList";
import { useIsClient } from "hooks/utils";
import * as Popover from "@radix-ui/react-popover";
import { useSpaceData } from "hooks/useSpaceData";
import { spaceAPI } from "backend/lib/api";
import { LoginButton } from "./LoginModal";

type Props = {
  studio?: { spaces: SpaceData[]; studioName: string; studioID: string };
  space_id: string;
};

export const Space = (props: Props) => {
  useSpaceSyncState();
  useSpaceShortcuts();

  useEffect(() => {
    window.requestAnimationFrame(() => {
      let roomPane = document.getElementById("roomInnerWrapper");
      roomPane?.scrollIntoView();
    });
  }, []);

  return (
    <>
      <PresenceHandler />
      <div className="spaceRoomAndSidebar border-grey-90 relative flex  shrink-0 snap-center snap-always  flex-row rounded-md border">
        <Room />
      </div>
      <CardViewer space_id={props.space_id} />
    </>
  );
};

export const SpaceRoleBadge = (props: { space_id: string }) => {
  let { session, authToken } = useAuth();
  let { data: spaceData, mutate } = useSpaceData(props);
  let isMember = spaceData?.members_in_spaces.find(
    (m) => m.member === session.user?.id
  );
  let isStudioMate = spaceData?.spaces_in_studios.find(
    (s) =>
      !!s.studios?.members_in_studios.find((f) => f.member === session.user?.id)
  );

  let spaceIsOpenInvite = spaceData?.spaces_in_studios?.find(
    (s) => s.studios?.allow_members_to_join_spaces
  )?.studios?.allow_members_to_join_spaces;

  return (
    <div className="flex items-center gap-2">
      {session.loggedIn ? (
        <div
          className={`flex w-fit items-center gap-2 place-self-end rounded-full border py-[2px] pl-[6px] pr-[4px] text-sm font-bold ${
            isMember
              ? "border-grey-80 bg-bg-blue text-grey-55"
              : isStudioMate
              ? "border-grey-80 bg-grey-90 text-grey-55 "
              : "border-grey-80 text-grey-55"
          }`}
        >
          {isMember ? (
            <InfoPopover triggerTitle="Member">
              <p>
                <b>You have full access!</b> Make and edit cards, comment, chat,
                anything you want!
              </p>
            </InfoPopover>
          ) : isStudioMate ? (
            <InfoPopover triggerTitle="Studiomate">
              <p>
                You can <b>chat and comment on cards</b> here!
              </p>
              <p>
                To make and edit cards, you need to join this Space.
                {!spaceIsOpenInvite && " Ask a member to invite you!"}
              </p>
            </InfoPopover>
          ) : (
            <InfoPopover triggerTitle="Guest">
              <p>
                You&apos;re a guest here.{" "}
                <b>You can&apos;t make any changes to this space.</b>
              </p>
              <p>To join, ask a member to invite you!</p>
            </InfoPopover>
          )}
        </div>
      ) : (
        <LoginButton small />
      )}

      {!isMember && isStudioMate && spaceIsOpenInvite && (
        <ButtonPrimary
          content="Join!"
          className="!py-[1px] !text-sm"
          onClick={async () => {
            if (!authToken) return;
            let data = await spaceAPI(
              `${WORKER_URL}/space/${spaceData?.do_id}`,
              "join",
              {
                authToken,
                code: "",
                joinFromStudioMate: true,
              }
            );
            if (data.success) mutate();
          }}
        />
      )}
    </div>
  );
};

export const HelpButton = (props: { onClick?: () => void }) => {
  let [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          props.onClick?.();
        }}
        className="text-grey-55 hover:text-accent-blue"
      >
        <Help />
      </button>
      <HelpModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};

const InfoPopover = (props: {
  children: React.ReactNode;
  triggerTitle: string;
}) => {
  return (
    <Popover.Root>
      <Popover.Trigger className="flex place-items-center gap-1">
        {props.triggerTitle}
        <InfoTiny />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={8} collisionPadding={24} className="z-50">
          <div className="lightBorder text-grey-55 flex max-w-xs flex-col gap-2 rounded-sm bg-white p-2 text-xs font-normal shadow-lg">
            {props.children}
          </div>
          <Popover.Close />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
