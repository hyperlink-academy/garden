import { useAuth } from "hooks/useAuth";
import Link from "next/link";
import useSWR from "swr";
import { useRouter } from "next/router";
import { Cross, ExitDoor, HighlightNote, Member, MemberAdd } from "./Icons";
import { spacePath } from "hooks/utils";
import { useIndex, useSpaceID } from "hooks/useReplicache";
import { Divider, Modal } from "./Layout";
import { useNextHighlight } from "hooks/useNextHighlight";
import { useState } from "react";
import { ButtonLink, ButtonPrimary, ButtonSecondary } from "./Buttons";
import { LogInModal } from "./LoginModal";
import { spaceAPI } from "backend/lib/api";
import { useSmoker } from "./Smoke";

export const Header: React.FC = (props) => {
  let { session } = useAuth();
  let { query, pathname } = useRouter();

  let spaceName = useIndex.aev("this/name")[0];
  let newHighlightAvailable = useNextHighlight();
  let isHighlightPage = pathname.endsWith("/highlights");
  let [settingsOpen, setSettingsOpen] = useState(false);
  let [logInOpen, setLogInOpen] = useState(false);

  return (
    <div className="pageHeader shrink-0 pb-2 text-white">
      <div
        className={`
          headerWrapper
          max-w-6xl mx-auto px-3 
          before:content-[''] before:absolute before:w-[100vw] before:h-12 before:left-0 ${
            newHighlightAvailable
              ? "before:bg-accent-blue"
              : "before:bg-grey-35"
          }`}
      >
        <div className="headerContent flex gap-4 pt-3">
          {/* EXIT SPACE */}
          {!session.session ? (
            <div className="shink-0" />
          ) : (
            <div className="shrink-0 z-10 headerBackToStudio">
              <Link href={`/s/${session.session.username}`}>
                <div className="pt-1">
                  <ExitDoor />
                </div>
              </Link>
            </div>
          )}
          {/* END EXIT SPACE */}

          {/* SPACE NAME */}
          <p
            className="headerSpaceName z-10 pt-1 font-bold grow truncate"
            onClick={() => {
              !session.session ? null : setSettingsOpen(!settingsOpen);
            }}
          >
            {spaceName?.value}
          </p>
          <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)}>
            <Settings />
          </Modal>
          {/* END SPACE NAME */}

          {/* DESKTOP HIGHLIGHT SWITCHER || LOG IN*/}
          <div className="z-10 shrink-0 flex gap-4">
            {!session.session ? (
              <>
                <ButtonSecondary
                  content="Log In"
                  onClick={() => setLogInOpen(!logInOpen)}
                />

                <LogInModal
                  isOpen={logInOpen}
                  onClose={() => setLogInOpen(false)}
                />
              </>
            ) : (
              <>
                <div
                  className={`${
                    newHighlightAvailable ? "text-accent-blue" : "text-grey-35"
                  } flex gap-2 `}
                >
                  <div
                    className={`${
                      isHighlightPage
                        ? `bg-transparent border border-transparent hover:border hover:border-white text-white `
                        : `bg-background text-inherit font-bold`
                    } rounded-t-md rounded-b-none pt-1 pb-3 px-2`}
                  >
                    <Link href={`${spacePath(query.studio, query.space)}`}>
                      Desktop
                    </Link>
                  </div>
                  <div
                    className={`${
                      isHighlightPage
                        ? `bg-background text-inherit font-bold`
                        : `bg-transparent border border-transparent hover:border hover:border-white text-white `
                    } rounded-t-md rounded-b-none  pt-1 pb-3  px-2`}
                  >
                    <Link
                      href={`${spacePath(
                        query.studio,
                        query.space
                      )}/highlights`}
                    >
                      <HighlightNote />
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
          {/* END INVITE LINK + DESKTOP HIGHLIGHT SWITCHER || LOG IN*/}
        </div>
      </div>
    </div>
  );
};

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;

const Settings = () => {
  let { session } = useAuth();
  let isMember = useIndex.ave("space/member", session.session?.studio);
  let smoker = useSmoker();
  const spaceID = useSpaceID();
  let { data: inviteLink } = useSWR(
    !isMember ? null : `${WORKER_URL}/space/${spaceID}/get_share_code`,
    async () => {
      if (!spaceID || !session.token) return;
      let code = await spaceAPI(
        `${WORKER_URL}/space/${spaceID}`,
        "get_share_code",
        {
          token: session.token,
        }
      );
      if (code.success) {
        return `${document.location.href}/join?code=${code.code}`;
      }
    }
  );

  const getShareLink = async (e: React.MouseEvent) => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    smoker({ position: { x: e.clientX, y: e.clientY }, text: "copied!" });
  };

  if (inviteLink) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3>Space Settings</h3>

          <Cross />
        </div>
        <div className="flex flex-col gap-2">
          <h4>Members</h4>
          <ul>
            <li className="flex gap-2">
              <Member /> brendan
            </li>
            <li className="flex gap-2">
              <Member /> jared
            </li>
            <li className="flex gap-2">
              <Member /> celine
            </li>
          </ul>
          <div className="flex flex-col gap-2 text-center bg-bg-blue rounded-md border border-grey-80 p-4 mt-2">
            <p className="font-bold text-small text-grey-35 ">
              Share this link to invite new members!
            </p>
            <div className="w-full flex flex-col gap-2">
              <input
                className="grow"
                readOnly
                value={inviteLink}
                onClick={getShareLink}
              />
              <div className="mx-auto h-full">
                <ButtonSecondary onClick={getShareLink} content="Copy Link" />
              </div>
            </div>
          </div>
        </div>
        <Divider />
        <div className="flex flex-col gap-2 justify-between">
          Remove yourself permanently from this space?
          <div className="">
            <ButtonPrimary destructive content="Leave Space Forever" />
          </div>
        </div>
      </div>
    );
  }
  return null;
};
