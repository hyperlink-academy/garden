import { spaceAPI, workerAPI } from "backend/lib/api";
import { SpaceProvider } from "components/ReplicacheProvider";
import { SpaceList } from "components/SpacesList";
import { useAuth } from "hooks/useAuth";
import { ReplicacheContext, useIndex } from "hooks/useReplicache";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import useSWR from "swr";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export default function StudioPage() {
  let router = useRouter();
  let { session, logout } = useAuth();
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
  if (!id) return <div> loading</div>;
  if (!id.success) return <div>404 studio</div>;
  return (
    <SpaceProvider id={id.id}>
      <StudioName />
      <CreateSpace spaceID={id.id}/>
      <SpaceList />
      {session.session?.username === router.query.studio ? (
        <button onClick={() => logout()}>logout</button>
      ) : null}
    </SpaceProvider>
  );
}

const StudioName = () => {
  let name = useIndex.ave("this/name", "");
  return <div>{name?.value}</div>;
};

const CreateSpace = (props:{spaceID: string}) => {
  let [name, setName] = useState('')
  let auth = useAuth()
  let rep = useContext(ReplicacheContext)
  if(!auth.session.loggedIn) return null
  return <div>
  <input value={name} onChange={e=>setName(e.currentTarget.value)}/>
  <button onClick={async ()=> {
    if(!auth.session.loggedIn || !name) return
    await spaceAPI(`${WORKER_URL}/space/${props.spaceID}`, 'create_space', {
      name,
      token: auth.session.token
        })
    setName('')
    rep?.rep.pull()
  }}>create</button>
  </div>;
};
