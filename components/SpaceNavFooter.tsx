import { useAuth } from "hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/router";
import { ChatBubble, House, Information, SpreadDeck } from "./Icons";

export function SpaceNavFooter(props: { currentPage: string }) {
  let router = useRouter();
  let { session } = useAuth();
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100vw",
      }}
      className={`grid items-center grid-cols-[1fr,1fr,1fr] gap-1  bg-background border-t-2 px-4 border-grey-15`}
    >
      <Link href={!session?.loggedIn ? `/` : `/s/${session.session.username}`}>
        <a className="justify-self-start">
          <House className="text-grey-55" />
        </a>
      </Link>

      <div className="justify-self-center flex flex-row">
        <Link href={`/s/${router.query.studio}/a/${router.query.activity}`}>
          <a className="border-2 border-t-0 rounded-b-lg px-2 relative -top-0.5 bg-background border-grey-15">
            <SpreadDeck />
          </a>
        </Link>

        <Link href="/chat">
          <a>
            <ChatBubble />
          </a>
        </Link>
      </div>
      <Link href="/">
        <a className="justify-self-end">
          <Information className="text-grey-55" />
        </a>
      </Link>
    </div>
  );
}
