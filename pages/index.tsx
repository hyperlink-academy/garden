import { useAuth } from "hooks/useAuth";
import Link from "next/link";

export default function IndexPage() {
  let { session } = useAuth();
  return (
    <div>
      <div className="text-accent-blue">hello world</div>
      {session.loggedIn ? (
        <Link href={`/s/${session.session.username}`}>
          <a>home studio</a>
        </Link>
      ) : (
        "logged out"
      )}
    </div>
  );
}
