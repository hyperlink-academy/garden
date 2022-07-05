import { useAuth } from "hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ChatBubble,
  Information,
  DeckLarge,
  ExitDoor,
  ActivityBlocks,
} from "./Icons";
import { ButtonLink } from "./Buttons";
import { useContext, useState } from "react";
import { Modal } from "components/Layout";
import { LogInModal } from "./LoginModal";
import { SmallCardDragContext } from "./DragContext";
import { usePreserveScroll } from "hooks/utils";
import {
  ReplicacheContext,
  scanIndex,
  useIndex,
  useSpaceID,
} from "hooks/useReplicache";
import { useSubscribe } from "replicache-react";
import { Message } from "data/Messages";
import { useInActivity } from "hooks/useInActivity";

export const SpaceLayout: React.FC = (props) => {
  let { ref } = usePreserveScroll<HTMLDivElement>();

  return (
    <>
      <style jsx>{`
        @media print {
          height: auto;
        }
        @media (min-height: 500px) {
          .navPadding {
            padding-bottom: 64px;
          }
        }
      `}</style>
      <div className="h-full pt-4 px-4 overflow-auto navPadding" ref={ref}>
        <SmallCardDragContext>{props.children}</SmallCardDragContext>
        <Footer />
      </div>
    </>
  );
};

export function Footer() {
  let router = useRouter();
  let { session } = useAuth();
  let [isOpen, setLogInModal] = useState(false);

  return (
    <>
      <style jsx>{`
        @media print (max-height: 500px) {
          .menu {
            display: none;
          }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
        className={`menu z-50 w-full px-4`}
      >
        <div className="grid max-w-3xl mx-auto">
          <div
            style={{ gridArea: "1 / 1 / 2 / 2" }}
            className="flex flex-row rounded-md bg-grey-15 px-4 -mb-0.5 mt-0.5 -ml-0.5 mr-0.5"
          />
          <div
            style={{ gridArea: "1 / 1 / 2 / 2" }}
            className="flex flex-row rounded-md bg-white border-2 border-grey-15 px-4 justify-between w-full"
          >
            <div className="flex flex-row">
              {!session?.loggedIn ? (
                <>
                  <ButtonLink
                    className="justify-self-start"
                    content="Log In"
                    onClick={() => setLogInModal(true)}
                  />
                  <LogInModal
                    isOpen={isOpen}
                    onClose={() => setLogInModal(false)}
                  />
                </>
              ) : (
                <Link href={`/s/${session.session.username}`}>
                  <a className="justify-self-start flex items-center">
                    <ExitDoor />
                  </a>
                </Link>
              )}

              <div className="h-full py-1 px-2">
                <svg
                  width="1"
                  height="30"
                  viewBox="0 0 1 30"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <line
                    x1="0.5"
                    y1="1.01709"
                    x2="0.499999"
                    y2="29.0171"
                    stroke="#E6E6E6"
                    stroke-linecap="round"
                  />
                </svg>
              </div>

              <div className="justify-self-center flex flex-row gap-2">
                {/* DECKS */}
                <FooterItem
                  active={(r) =>
                    !r.includes("/chat") && !r.includes("/activity")
                  }
                  route={`/s/${router.query.studio}/s/${router.query.space}`}
                >
                  <DeckLarge width={32} height={32} />
                </FooterItem>
                {/* CHAT */}
                <FooterItem
                  active={(r) => r.endsWith("chat")}
                  route={`/s/${router.query.studio}/s/${router.query.space}/chat`}
                >
                  <ChatIcon />
                </FooterItem>

                <Activity />
              </div>
            </div>

            {/* INFO */}
            <InfoModal />
          </div>
        </div>
      </div>
    </>
  );
}

const Activity = () => {
  let router = useRouter();
  let inActivity = useInActivity();
  let activityName = useIndex.eav(
    inActivity?.value.value || null,
    "activity/name"
  );
  let selected = router.asPath.includes("/activity");
  return (
    <Link
      href={`/s/${router.query.studio}/s/${router.query.space}/activity${
        !inActivity ? "" : `/${inActivity.value.value}`
      }`}
    >
      <a
        className={`px-1 grid grid-flow-col ${
          !selected
            ? ""
            : "bg-grey-15 text-white rounded-md relative -top-2 mb-1"
        }`}
      >
        {activityName ? (
          <small
            className={`self-baseline mt-[5px] italic col-start-1 row-start-1 ml-4 pl-5 pr-4 whitespace-nowrap overflow-hidden mr-4 ${
              !selected ? "bg-grey-90 rounded-r-full " : ""
            }`}
          >
            {activityName?.value}
          </small>
        ) : null}
        <span className="col-start-1 row-start-1">
          <ActivityBlocks />
        </span>
      </a>
    </Link>
  );
};

const FooterItem: React.FC<{
  route: string;
  active: (route: string) => boolean;
}> = (props) => {
  let router = useRouter();
  let selected = props.active(router.asPath);
  return (
    <Link href={props.route}>
      <a
        className={`w-10 px-1 ${
          !selected
            ? ""
            : "bg-grey-15 text-white rounded-md relative -top-2 mb-1"
        }`}
      >
        {props.children}
      </a>
    </Link>
  );
};

const ChatIcon = () => {
  let ctx = useContext(ReplicacheContext);
  let spaceID = useSpaceID();
  let { rep: studio } = useAuth();
  let lastSeen = useSubscribe(
    studio,
    async (tx) => {
      if (!spaceID) return 0;
      let q = scanIndex(tx);
      let space = await q.ave("space/id", spaceID);
      if (!space) return 0;
      let latest = await q.eav(space.entity, "space/lastSeenMessage");
      return latest?.value || 0;
    },
    0,
    [spaceID]
  );
  let latestMsg = useSubscribe(
    ctx?.rep,
    async (tx) => {
      let messages = await tx
        .scan({ indexName: "messages" })
        .values()
        .toArray();
      let lastMessage = messages[messages.length - 1] as Message;
      return lastMessage?.index || 0;
    },
    0,
    []
  );

  return (
    <div>
      <ChatBubble width={32} height={32} />
      {lastSeen && latestMsg > lastSeen ? (
        <div className="bg-accent-red absolute rounded-full top-1.5 left-10 w-3 h-3"></div>
      ) : null}
    </div>
  );
};

function InfoModal() {
  let [isOpen, setInfoModal] = useState(false);

  return (
    <div className="justify-self-end flex items-center">
      <button onClick={() => setInfoModal(true)}>
        <Information />
      </button>

      <Modal open={isOpen} onClose={() => setInfoModal(false)}>
        <h2>Hyperlink Info</h2>
        <p>Looking for help? A few pointers 🌱👇</p>
        <ul className="list-disc list-inside">
          <li className="pb-4">
            <a
              href="https://hyperlink.garden/s/Hyperlink%20Team/s/Hyperlink%20Handbook"
              target="_blank"
              className="text-accent-blue hover:underline decoration-accent-blue"
            >
              Hyperlink Handbook
            </a>
            : read our in-depth guide to the Hyperlink app
          </li>
          <li className="pb-4">
            <a
              href="https://hyperlink.garden/s/Hyperlink%20Team/s/Hypernaut%20Hub"
              target="_blank"
              className="text-accent-blue hover:underline decoration-accent-blue"
            >
              Hypernaut Hub
            </a>
            : share bugs, questions, suggestions, or just hang and chat!
          </li>
          <li>
            <a
              href="https://hyperlink.garden/s/Hyperlink%20Team/s/Activity%20Library"
              target="_blank"
              className="text-accent-blue hover:underline decoration-accent-blue"
            >
              Activity Library
            </a>
            : explore other interesting Spaces for inspiration
          </li>
        </ul>
        <p>
          You can also{" "}
          <a
            href="mailto:contact@hyperlink.academy"
            target="_blank"
            className="text-accent-blue hover:underline decoration-accent-blue"
          >
            email us
          </a>{" "}
          with any private questions or feedback — thanks!
        </p>
      </Modal>
    </div>
  );
}
