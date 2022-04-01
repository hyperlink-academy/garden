import { spaceAPI } from "backend/lib/api";
import { SpaceProvider } from "components/ReplicacheProvider";
import { useIndex } from "hooks/useReplicache";
import { useRouter } from "next/router";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export default function StudioPage() {
  let router = useRouter();
  return (
    <SpaceProvider id={router.query.studio as string}>
      <StudioName />
      <div>
        {router.query.studio}
        <button
          onClick={() =>
            spaceAPI
              .mutation(`${WORKER_URL}/space/${router.query.studio}`, "pull", {
                lastMutationID: 0,
                clientID: "test",
                pullVersion: 0,
                schemaVersion: "",
              })
              .then((d) => {
                console.log(
                  d.data
                    .filter((f) => f.attribute === "name")
                    .map((f) => f.value)
                );
              })
          }
        >
          pull
        </button>
      </div>
    </SpaceProvider>
  );
}

const StudioName = () => {
  let name = useIndex.ave("this/name", "");
  return <div>{name?.value}</div>;
};
