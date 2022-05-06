import { useSpaceID } from "hooks/useReplicache";
import { useEffect } from "react";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export default function SpacePage() {
  let spaceID = useSpaceID();
  useEffect(() => {
    if (!spaceID) return;
    window.location.assign(`${WORKER_URL}/space/${spaceID}/graphql`);
  }, [spaceID]);
  return <>redirecting</>;
}
