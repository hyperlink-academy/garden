import { spaceAPI } from "backend/lib/api";
import { useAuth } from "hooks/useAuth";
import { ReplicacheContext, useMutations } from "hooks/useReplicache";
import { useContext, useState } from "react";
import { ButtonSecondary, ButtonTertiary } from "./Buttons";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;

let doorImages: string[] = [
  "/doors/door-clouds-256.jpg",
  "/doors/door-chicken-256.jpg",
  "/doors/door-field-256.jpg",
  "/doors/door-windowseat-256.jpg",
];

export const CreateOrEditSpace = (props: {
  setOpen: (value: boolean | ((prevVar: boolean) => boolean)) => void;
  spaceID?: string;
  studioSpaceID?: string;
}) => {
  let [name, setName] = useState("");
  let auth = useAuth();
  let rep = useContext(ReplicacheContext);
  let { authorized, mutate } = useMutations();
  return !authorized ? null : (
    <div className="flex-col">
      {/* space name */}
      {/* TODO: allow renaming spaces */}
      {!props.studioSpaceID ? null : (
        <div>
          <p className="font-bold">Space Name</p>
          <input
            className="mb-2"
            value={name}
            placeholder=""
            onChange={(e) => setName(e.currentTarget.value)}
          />
          <DoorSelector />
        </div>
      )}

      {/* door image selector */}
      {!props.spaceID ? null : <DoorSelector />}

      {/* create OR close */}
      {/* TODO */}
      <ButtonTertiary
        content="Nevermind"
        onClick={() => props.setOpen(false)}
      />

      {!props.studioSpaceID ? (
        ""
      ) : (
        <ButtonSecondary
          content="Create"
          onClick={async () => {
            if (!auth.session.loggedIn || !name) return;
            await spaceAPI(
              `${WORKER_URL}/space/${props.studioSpaceID}`,
              "create_space",
              {
                name,
                token: auth.session.token,
              }
            );
            setName("");
            rep?.rep.pull();
            props.setOpen(false);
          }}
        />
      )}
    </div>
  );
};

const DoorSelector = (props: { spaceID?: string }) => {
  let { mutate } = useMutations();
  return (
    <div>
      <p>Select the Scenery</p>
      {doorImages.map((f) => {
        return (
          <button
            onClick={() => {
              mutate("assertFact", {
                entity: props.spaceID as string,
                attribute: "space/door/image",
                value: f,
                positions: {},
              });
            }}
          >
            <img className={`-scale-x-100 opacity-30`} src={f} width={64} />
          </button>
        );
      })}
    </div>
  );
};
