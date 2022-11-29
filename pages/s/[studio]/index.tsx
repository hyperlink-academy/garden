import { spaceAPI, workerAPI } from "backend/lib/api";
import {
  ButtonSecondary,
  ButtonTertiary,
  ButtonPrimary,
} from "components/Buttons";
import { Door, DoorSelector } from "components/DoorSelector";
import { SpaceNew } from "components/Icons";
import { Modal } from "components/Layout";
import { SpaceList } from "components/SpacesList";
import { StudioLayout } from "components/StudioLayout";
import { useAuth } from "hooks/useAuth";
import { ReplicacheContext, useIndex, useMutations } from "hooks/useReplicache";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import { useContext, useState } from "react";
import { sortByPosition } from "src/position_helpers";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
type Props = InferGetStaticPropsType<typeof getStaticProps>;
export default function StudioPage(props: Props) {
  if (props.notFound) return <div>404 - studio not found!</div>;
  if (!props.id) return <div>loading </div>;

  return (
    <>
      <List />
      <CreateSpace studioSpaceID={props.id} />
    </>
  );
}
const List = () => {
  let spaces = useIndex.aev("space/name").sort(sortByPosition("aev"));
  let completedSpaces = useIndex
    .aev("space/completed")
    .sort(sortByPosition("aev"));
  return (
    <SpaceList
      spaces={spaces.filter(
        (f) => !completedSpaces.find((c) => c.entity === f.entity && c.value)
      )}
    />
  );
};

const CreateSpace = (props: { studioSpaceID: string }) => {
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
      <div className="w-full grid">
        <a className="place-self-center">
          <ButtonSecondary
            icon={<SpaceNew />}
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

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps(ctx: GetStaticPropsContext) {
  if (!ctx.params?.studio)
    return { props: { notFound: true }, revalidate: 10 } as const;
  let id = await workerAPI(WORKER_URL, "get_studio", {
    name: ctx.params?.studio as string,
  });
  if (!id.success)
    return { props: { notFound: true }, revalidate: 10 } as const;
  return { props: { notFound: false, id: id.id } };
}
