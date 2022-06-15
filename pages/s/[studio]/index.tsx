import { spaceAPI, workerAPI } from "backend/lib/api";
import { ButtonSecondary, ButtonLink } from "components/Buttons";
import { CreateOrEditSpace } from "components/CreateOrEditSpace";
import { Studio } from "components/Icons";
import { Modal } from "components/Layout";
import { SpaceProvider } from "components/ReplicacheProvider";
import { SpaceList } from "components/SpacesList";
import { useAuth } from "hooks/useAuth";
import { ReplicacheContext, useIndex, useMutations } from "hooks/useReplicache";
import Head from "next/head";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import useSWR from "swr";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export default function StudioPage() {
  let router = useRouter();
  let { data: id } = useSWR(
    "/space/" + router.query.studio,
    () => {
      let id = workerAPI(WORKER_URL, "get_studio", {
        name: router.query.studio as string,
      });
      return id;
    },
    { revalidateOnFocus: false }
  );

  if (!id) return <div>loading…</div>;
  if (!id.success) return <div>404 - studio not found!</div>;
  return (
    <SpaceProvider id={id.id}>
      <div className="grid grid-flow-row gap-8 my-6">
        <div className="flex justify-between">
          <StudioName />
          <Logout />
        </div>
        <SpaceList />
        <CreateSpaceButton studioSpaceID={id.id} />
      </div>
    </SpaceProvider>
  );
}

const StudioName = () => {
  let name = useIndex.aev("this/name", "")[0];
  return (
    <>
      <Head>
        <title key="title">{name?.value}'s studio</title>
      </Head>
      <div>
        <h1>{name?.value}'s studio</h1>
      </div>
    </>
  );
};

const Logout = () => {
  let { session, logout } = useAuth();
  let router = useRouter();
  return session.session?.username === router.query.studio ? (
    <div className="self-center">
      <ButtonLink content="logout" onClick={() => logout()} />
    </div>
  ) : null;
};

const CreateSpaceButton = (props: { studioSpaceID: string }) => {
  let [open, setOpen] = useState(false);
  let { authorized } = useMutations();
  if (authorized === false) {
    return null;
  } else
    return (
      <div className="pb-4 grid">
        <div className="place-self-center">
          <a>
            <ButtonSecondary
              content="Create a New Space"
              icon={<Studio />}
              onClick={() => setOpen(true)}
            />
          </a>
          <Modal open={open} onClose={() => setOpen(false)}>
            <CreateOrEditSpace
              setOpen={setOpen}
              studioSpaceID={props.studioSpaceID}
            />
          </Modal>
        </div>
      </div>
    );
};
