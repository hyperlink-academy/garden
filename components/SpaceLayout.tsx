import { useAuth } from "hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/router";
import { ChatBubble, Studio, Information, DeckLarge } from "./Icons";
import { ButtonLink, ButtonPrimary, ButtonTertiary } from "./Buttons";
import { useContext, useEffect, useState } from "react";
import { Modal } from "components/Layout";
import { LogInModal } from "./LoginModal";
import { SmallCardDragContext } from "./DragContext";
import { usePreserveScroll } from "hooks/utils";
import { ReplicacheContext, scanIndex, useSpaceID } from "hooks/useReplicache";
import { useSubscribe } from "replicache-react";
import { Message } from "data/Messages";

export const SpaceLayout: React.FC = (props) => {
  let { ref } = usePreserveScroll<HTMLDivElement>();

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        position: "relative",
      }}
    >
      <div className="h-full pt-4 px-4 overflow-auto" ref={ref}>
        <div
          style={{
            height: "100%",
            margin: "auto",
            maxWidth: "48rem",
          }}
        >
          <SmallCardDragContext>{props.children}</SmallCardDragContext>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const selectedClassname =
  "border-2 border-t-0 rounded-b-lg px-2 relative -top-0.5 bg-background border-grey-15";
export function Footer() {
  let router = useRouter();
  let { session } = useAuth();
  let [isOpen, setLogInModal] = useState(false);

  return (
    <>
      <style jsx>{`
        @media (max-height: 500px) {
          .menu {
            display: none;
          }
        }
      `}</style>
      <div
        style={{
          width: "100%",
          margin: "auto",
          maxWidth: "48rem",
        }}
        className={`menu
        grid grid-cols-[1fr,1fr,1fr] gap-1 items-center
        bg-background border-t-2 border-grey-15 
        px-4 pb-5
        `}
      >
        {/* BACK TO STUDIO */}

        {!session?.loggedIn ? (
          <>
            <ButtonLink
              className="justify-self-start"
              content="Log In"
              onClick={() => setLogInModal(true)}
            />
            <LogInModal isOpen={isOpen} onClose={() => setLogInModal(false)} />
          </>
        ) : (
          <Link href={`/s/${session.session.username}`}>
            <a className="justify-self-start">
              <Studio className="text-grey-55" />
            </a>
          </Link>
        )}

        <div className="justify-self-center flex flex-row">
          {/* DECKS */}
          <Link href={`/s/${router.query.studio}/s/${router.query.space}`}>
            <a
              className={
                router.pathname === "/s/[studio]/s/[space]/chat"
                  ? "w-16"
                  : selectedClassname
              }
            >
              <DeckLarge className="mx-auto" />
            </a>
          </Link>
          {/* CHAT */}
          <ChatIcon />
        </div>

        {/* INFO */}
        <InfoModal />
      </div>
    </>
  );
}

const ChatIcon = () => {
  let router = useRouter();
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
    <Link href={`/s/${router.query.studio}/s/${router.query.space}/chat`}>
      <a
        className={`relative ${
          router.pathname === "/s/[studio]/s/[space]/chat"
            ? selectedClassname
            : "w-16"
        }`}
      >
        <ChatBubble className="mx-auto" />
        {lastSeen && latestMsg > lastSeen ? (
          <div className="bg-accent-red absolute rounded-full top-1.5 left-10 w-3 h-3"></div>
        ) : null}
      </a>
    </Link>
  );
};

function InfoModal() {
  let [isOpen, setInfoModal] = useState(false);

  return (
    <div className="justify-self-end">
      <button onClick={() => setInfoModal(true)}>
        <Information className="text-grey-55" />
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
