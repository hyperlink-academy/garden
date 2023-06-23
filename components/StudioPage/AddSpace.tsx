import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { spaceAPI, workerAPI } from "backend/lib/api";
import { Database } from "backend/lib/database.types";
import {
  ButtonLink,
  ButtonPrimary,
  ButtonSecondary,
  ButtonTertiary,
} from "components/Buttons";
import { CreateSpaceForm, CreateSpaceFormState } from "components/CreateSpace";
import { DotLoader } from "components/DotLoader";
import { SpaceCreate } from "components/Icons";
import { Modal } from "components/Layout";
import { useAuth } from "hooks/useAuth";
import { useIdentityData } from "hooks/useIdentityData";
import { scanIndex, useMutations } from "hooks/useReplicache";
import { useStudioData } from "hooks/useStudioData";
import { useEffect, useState } from "react";
import { generateKeyBetween } from "src/fractional-indexing";
import { ulid } from "src/ulid";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export function AddSpace(props: { id: string }) {
  let [open, setOpen] = useState(false);
  let { data } = useStudioData(props.id);
  let [state, setState] = useState<"normal" | "add-new" | "add-existing">(
    "normal"
  );
  useEffect(() => {
    if (!open) setState("normal");
  }, [open]);
  return (
    <>
      <ButtonTertiary
        content={"Add a space"}
        onClick={() => setOpen(true)}
        icon={<SpaceCreate />}
      />
      <Modal open={open} onClose={() => setOpen(false)}>
        {state === "normal" ? (
          <>
            <p className="text-center">
              When you link a space to a studio, your studiomates will be able
              to cheer you on by <b>commenting</b>, <b>reacting</b>, and{" "}
              <b>highlighting cards</b> in the space that they think are
              amazing!
            </p>
            <button
              className="rounded-md border-2 border-grey-80 py-3 px-4 hover:border-accent-blue hover:bg-bg-blue"
              onClick={() => {
                setState("add-new");
              }}
            >
              <h3> Link a New Space</h3>
              <p className="text-grey-35">
                Create a brand new space and link it to {data?.name}. It will
                also appear in your Homepage.
              </p>
            </button>

            <button
              className="rounded-md border-2 border-grey-80 py-3 px-4 hover:border-accent-blue hover:bg-bg-blue"
              onClick={() => {
                setState("add-existing");
              }}
            >
              <h3> Link an Existing Space</h3>
              <p className="text-grey-35">
                Link a space you’ve already made to Learning Anti-Book Club.
              </p>
              <p className="text-grey-35">
                Spaces can be linked to multiple Studios!
              </p>
            </button>
          </>
        ) : state === "add-existing" ? (
          <AddExistingSpace
            onClose={() => setOpen(false)}
            studioID={props.id}
          />
        ) : (
          <AddNewSpace onClose={() => setOpen(false)} studioID={props.id} />
        )}
      </Modal>
    </>
  );
}

const AddNewSpace = (props: { onClose: () => void; studioID: string }) => {
  let [formState, setFormState] = useState<CreateSpaceFormState>({
    display_name: "",
    description: "",
    start_date: "",
    end_date: "",
    image: null,
    default_space_image: null,
  });

  let { mutate: mutateStudioData } = useStudioData(props.studioID);

  let auth = useAuth();
  let { mutate, rep } = useMutations();
  let [status, setStatus] = useState<"normal" | "loading">("normal");
  return (
    <>
      <CreateSpaceForm formState={formState} setFormState={setFormState} />
      <div className="flex gap-4 place-self-end">
        <ButtonLink
          content={"Nevermind"}
          onClick={async () => {
            props.onClose();
          }}
        />
        <ButtonPrimary
          content={status === "normal" ? "Create" : <DotLoader />}
          disabled={
            !formState.display_name ||
            !(formState.image || formState.default_space_image)
          }
          onClick={async () => {
            if (
              !auth.session.loggedIn ||
              !auth.authToken ||
              !rep ||
              !formState.display_name
            )
              return;
            let result = await spaceAPI(
              `${WORKER_URL}/space/${auth.session.session?.studio}`,
              "create_space",
              {
                authToken: auth.authToken,
                ...formState,
              }
            );
            if (!result.success) return;

            await workerAPI(WORKER_URL, "add_space_to_studio", {
              authToken: auth.authToken,
              studio_id: props.studioID,
              space_do_id: result.data.do_id,
            });

            let latestPost = await rep.query(async (tx) => {
              let posts = await scanIndex(tx).aev("feed/post");
              return posts.sort((a, b) => {
                let aPosition = a.value,
                  bPosition = b.value;
                if (aPosition === bPosition) return a.id > b.id ? 1 : -1;
                return aPosition > bPosition ? 1 : -1;
              })[0]?.value;
            });
            let entity = ulid();
            mutate("assertFact", [
              {
                entity,
                attribute: "feed/post",
                value: generateKeyBetween(null, latestPost || null),
                positions: {},
              },
              {
                entity,
                attribute: "post/type",
                value: "space_added",
                positions: {},
              },
              {
                entity,
                attribute: "post/attached-space",
                value: result.data.do_id,
                positions: {},
              },
            ]);
            mutateStudioData();
            setStatus("normal");
            props.onClose();
          }}
        />
      </div>
    </>
  );
};

const AddExistingSpace = (props: { onClose: () => void; studioID: string }) => {
  let { session, authToken } = useAuth();
  let { data: studioData, mutate: mutateStudioData } = useStudioData(
    props.studioID
  );
  let { mutate, rep } = useMutations();
  let { data } = useIdentityData(session?.session?.username);
  let [addedSpaces, setAddedSpaces] = useState<string[]>([]);
  let spaces = data?.members_in_spaces.filter((s) => {
    return !studioData?.spaces_in_studios.find(
      (f) => f.space === s.space_data?.do_id
    );
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3> Select Space(s) to Add </h3>
        <p className="text-grey-55">
          You can only add Spaces that are upcoming, active, or unscheduled
        </p>
      </div>
      <div>
        {spaces?.map(({ space_data }) =>
          !!space_data ? (
            <button
              key={space_data.do_id}
              onClick={() => {
                if (addedSpaces.includes(space_data.do_id))
                  setAddedSpaces((spaces) =>
                    spaces.filter((space) => space !== space_data.do_id)
                  );
                else setAddedSpaces((spaces) => [...spaces, space_data.do_id]);
              }}
              className={`w-full rounded-lg border ${addedSpaces.includes(space_data.do_id)
                  ? "border-accent-blue bg-accent-blue text-white"
                  : "border-grey-80 hover:border-accent-blue hover:bg-bg-blue"
                } py-2 px-3 text-left `}
            >
              <h3>{space_data.display_name}</h3>
            </button>
          ) : null
        )}
      </div>
      <div className="flex flex-row justify-end gap-2">
        <ButtonLink
          content="nevermind"
          className="font-normal"
          onClick={props.onClose}
        />
        <ButtonPrimary
          onClick={async () => {
            if (addedSpaces.length === 0) return;
            if (!authToken || !rep) return;

            for (let space of addedSpaces) {
              await workerAPI(WORKER_URL, "add_space_to_studio", {
                authToken,
                studio_id: props.studioID,
                space_do_id: space,
              });
              let latestPost = await rep.query(async (tx) => {
                let posts = await scanIndex(tx).aev("feed/post");
                return posts.sort((a, b) => {
                  let aPosition = a.value,
                    bPosition = b.value;
                  if (aPosition === bPosition) return a.id > b.id ? 1 : -1;
                  return aPosition > bPosition ? 1 : -1;
                })[0]?.value;
              });
              let entity = ulid();
              mutate("assertFact", [
                {
                  entity,
                  attribute: "feed/post",
                  value: generateKeyBetween(null, latestPost || null),
                  positions: {},
                },
                {
                  entity,
                  attribute: "post/type",
                  value: "space_added",
                  positions: {},
                },
                {
                  entity,
                  attribute: "post/attached-space",
                  value: space,
                  positions: {},
                },
              ]);
            }
            mutateStudioData();
          }}
          disabled={addedSpaces.length === 0}
          content={
            addedSpaces.length < 2
              ? "Add Space"
              : `Add ${addedSpaces.length} Spaces`
          }
        />
      </div>
    </div>
  );
};
