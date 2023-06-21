import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Database } from "backend/lib/database.types";
import { ButtonLink, ButtonPrimary, ButtonTertiary } from "components/Buttons";
import { CreateSpaceForm, CreateSpaceFormState } from "components/CreateSpace";
import { SpaceCreate } from "components/Icons";
import { Modal } from "components/Layout";
import { useAuth } from "hooks/useAuth";
import { useIdentityData } from "hooks/useIdentityData";
import { useStudioData } from "hooks/useStudioData";
import { useEffect, useState } from "react";

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
          <AddNewSpace />
        )}
      </Modal>
    </>
  );
}

const AddNewSpace = () => {
  let [formState, setFormState] = useState<CreateSpaceFormState>({
    display_name: "",
    description: "",
    start_date: "",
    end_date: "",
    image: null,
    default_space_image: null,
  });
  return (
    <>
      <CreateSpaceForm formState={formState} setFormState={setFormState} />
    </>
  );
};

const AddExistingSpace = (props: { onClose: () => void; studioID: string }) => {
  let { session } = useAuth();
  let { data } = useIdentityData(session?.session?.username);
  let supabase = useSupabaseClient<Database>();
  let [addedSpaces, setAddedSpaces] = useState<string[]>([]);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3> Select Space(s) to Add </h3>
        <p className="text-grey-55">
          You can only add Spaces that are upcoming, active, or unscheduled
        </p>
      </div>
      <div>
        {data?.members_in_spaces.map(({ space_data }) =>
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
            let result = await supabase?.from("spaces_in_studios").insert(
              addedSpaces.map((space) => {
                return { space, studio: props.studioID };
              })
            );
            console.log(result);
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
