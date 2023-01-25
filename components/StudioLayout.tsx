import { spaceAPI } from "backend/lib/api";
import { useAuth } from "hooks/useAuth";
import { ReplicacheContext, useIndex, useMutations } from "hooks/useReplicache";
import Head from "next/head";
import { useState, useContext } from "react";
import { ButtonPrimary, ButtonSecondary, ButtonTertiary } from "./Buttons";
import { Door, DoorSelector } from "./DoorSelector";
import { SpaceCreate } from "./Icons";
import { Modal } from "./Layout";

export const StudioName = () => {
  let name = useIndex.aev("this/name", "")[0];
  if (!name) return null;
  return (
    <>
      <Head>
        <title key="title">{name?.value}'s studio</title>
        <meta name="theme-color" content="#fffaf0" />
      </Head>
      <div>
        <h1>{name?.value}'s studio</h1>
      </div>
    </>
  );
};

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export const CreateSpace = (props: { studioSpaceID: string }) => {
  let [open, setOpen] = useState(false);
  let [name, setName] = useState("");
  let [door, setDoor] = useState<Door | undefined>();
  let auth = useAuth();
  let { authorized } = useMutations();
  let rep = useContext(ReplicacheContext);
  if (authorized === false) {
    return null;
  } else
    return (
      <div className="w-full grid mt-8">
        <a className="place-self-center">
          <ButtonSecondary
            icon={<SpaceCreate />}
            content="Create New Space!"
            onClick={() => setOpen(true)}
          />
        </a>
        <Modal open={open} onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-6 overflow-y-scroll">
            <div className="flex flex-col gap-1">
              <p className="font-bold">Name this space</p>
              <input
                className="w-full"
                value={name}
                placeholder=""
                onChange={(e) => setName(e.currentTarget.value)}
              />
            </div>
            <DoorSelector selected={door} onSelect={(d) => setDoor(d)} />

            <div className="flex gap-4 place-self-end">
              <ButtonTertiary
                content="Nevermind"
                onClick={() => setOpen(false)}
              />

              <ButtonPrimary
                content="Create!"
                disabled={!name || !door}
                onClick={async () => {
                  if (!auth.session.loggedIn || !name) return;
                  await spaceAPI(
                    `${WORKER_URL}/space/${props.studioSpaceID}`,
                    "create_space",
                    {
                      name: name.trim(),
                      token: auth.session.token,
                      image: door,
                    }
                  );
                  setName("");
                  rep?.rep.pull();
                  setOpen(false);
                }}
              />
            </div>
          </div>
        </Modal>
      </div>
    );
};

