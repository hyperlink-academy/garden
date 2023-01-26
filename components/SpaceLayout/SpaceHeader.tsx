import { useAuth } from "hooks/useAuth";
import Link from "next/link";
import useSWR from "swr";
import { BackToStudio as BackToStudioIcon, SearchOrCommand } from "../Icons";
import { useIndex, useMutations, useSpaceID } from "hooks/useReplicache";
import { useState } from "react";
import { ButtonLink, ButtonSecondary } from "../Buttons";
import { LogInModal } from "../LoginModal";
import { spaceAPI } from "backend/lib/api";
import { useSmoker } from "../Smoke";
import { Popover } from "@headlessui/react";
import { animated, useSpring } from "@react-spring/web";
import useMeasure from "react-use-measure";
import { Divider, Modal } from "components/Layout";
import { BaseSmallCard } from "components/CardPreview/SmallCard";
import { useAllItems, FindOrCreate } from "components/FindOrCreateEntity";
import { ulid } from "src/ulid";
import { publishAppEvent } from "hooks/useEvents";

export const SpaceHeader: React.FC<React.PropsWithChildren<unknown>> = () => {
  let { session } = useAuth();
  return (
    <div className="pageHeader absolute right-4 bottom-10 z-50 text-grey-35">
      <div
        className={`
          headerWrapper
          mx-auto
          flex max-w-6xl place-items-center gap-2 px-2
          pt-4 sm:px-4 sm:pt-8`}
      >
        {!session.session ? (
          <div className="z-10 flex shrink-0 gap-4">
            <Login />
          </div>
        ) : (
          <FindOrCreateBar />
        )}
      </div>
    </div>
  );
};

const SpaceNameContent = (props: { open: boolean }) => {
  let spaceName = useIndex.aev("this/name")[0];
  let [ref, { width }] = useMeasure();
  const [drawerRef, { height: innerHeight }] = useMeasure();

  let { minWidth, height } = useSpring({
    config: { mass: 0.1, tension: 500, friction: 25 },
    minWidth: props.open ? 256 : 0,
    height: props.open ? innerHeight : 0,
  });
  return (
    <div className="flex gap-2">
      <animated.div
        style={{
          minWidth: minWidth,
        }}
        ref={ref}
        className={`headerSpaceName relative z-10 max-w-md grow font-bold`}
      >
        <animated.div
          style={{
            width,
          }}
          className={`absolute overflow-hidden rounded-md border-accent-blue px-2 py-[2px] hover:border-accent-blue hover:bg-bg-blue hover:text-accent-blue ${
            props.open
              ? "border border-accent-blue bg-bg-blue text-accent-blue"
              : "border border-transparent"
          }`}
        >
          <Popover.Button
            as="div"
            className={`${
              props.open ? "" : "truncate"
            } font-bold outline-none hover:cursor-pointer`}
            style={{
              minWidth: props.open ? "240px" : undefined,
            }}
          >
            <h2>{spaceName?.value}</h2>
          </Popover.Button>

          <animated.div
            style={{
              height: height,
              overflow: "hidden",
            }}
          >
            <div ref={drawerRef} className="pb-2">
              <Settings />
            </div>
          </animated.div>
        </animated.div>
      </animated.div>
    </div>
  );
};

const Login = () => {
  let [logInOpen, setLogInOpen] = useState(false);
  return (
    <>
      <ButtonSecondary
        content="Log In"
        onClick={() => setLogInOpen(!logInOpen)}
      />

      <LogInModal isOpen={logInOpen} onClose={() => setLogInOpen(false)} />
    </>
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

  return (
    <div className="flex flex-col gap-2 pt-2">
      <Divider />
      <MembersModal />
      <ButtonSecondary
        onClick={(e) => getShareLink(e)}
        content={"Copy Invite Link"}
      />
      <input
        style={{ display: "none" }}
        className="grow"
        readOnly
        value={inviteLink}
        onClick={getShareLink}
      />
    </div>
  );
};

const MembersModal = () => {
  let [open, setOpen] = useState(false);
  let members = useIndex.aev("member/name");
  return (
    <>
      <ButtonSecondary content={"See Members"} onClick={() => setOpen(true)} />
      <Modal open={open} onClose={() => setOpen(false)}>
        <h2>Members</h2>
        <div className="flex h-full flex-wrap gap-2">
          {members.map((m) => (
            <Link href={`/s/${encodeURIComponent(m.value)}`}>
              <div className="w-[160px]">
                <div className={`memberCardBorder relative h-full grow `}>
                  <BaseSmallCard isMember memberName={m.value} content="" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Modal>
    </>
  );
};

const FindOrCreateBar = () => {
  let [open, setOpen] = useState(false);
  let items = useAllItems(open);

  let { mutate, memberEntity, action } = useMutations();
  return (
    <>
      <button className="group flex items-center" onClick={() => setOpen(true)}>
        <div className="rounded-md border border-accent-blue bg-accent-blue px-3 py-1 text-white hover:border hover:border-accent-blue hover:bg-bg-blue hover:text-accent-blue">
          <SearchOrCommand />
        </div>
      </button>
      <FindOrCreate
        allowBlank={true}
        onClose={() => setOpen(false)}
        //START OF ON SELECT LOGIC
        onSelect={async (cards) => {
          if (!memberEntity) return;

          action.start();

          for (let d of cards) {
            let entity;
            if (d.type === "create") {
              entity = ulid();

              if (d.name) {
                await mutate("createCard", {
                  entityID: entity,
                  title: d.name,
                  memberEntity,
                });
              }
            } else {
              entity = d.entity;
            }
            publishAppEvent("cardviewer.open-card", { entityID: entity });
          }

          action.end();
        }}
        // END OF ONSELECT LOGIC
        selected={[]}
        open={open}
        items={items}
      />
    </>
  );
};
