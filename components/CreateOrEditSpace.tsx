import { spaceAPI } from "backend/lib/api";
import { useAuth } from "hooks/useAuth";
import { ReplicacheContext, useMutations } from "hooks/useReplicache";
import { useContext, useState } from "react";
import { ButtonSecondary } from "./Buttons";

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
        <input
          className="mb-2"
          value={name}
          placeholder="space name…"
          onChange={(e) => setName(e.currentTarget.value)}
        />
      )}

      {/* door image selector */}
      {!props.spaceID ? null : (
        <div>
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
                <img className="-scale-x-100" src={f} width={64} />
              </button>
            );
          })}
        </div>
      )}

      {/* create OR close */}
      {/* TODO */}
      {!props.studioSpaceID ? (
        <ButtonSecondary content="Close" onClick={() => props.setOpen(false)} />
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
