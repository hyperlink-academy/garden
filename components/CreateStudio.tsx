import { workerAPI } from "backend/lib/api";
import { ButtonLink, ButtonPrimary, ButtonTertiary } from "components/Buttons";
import { useAuth } from "hooks/useAuth";
import { useRandomValue } from "hooks/useRandomValue";
import { useState } from "react";
import { DotLoader } from "./DotLoader";
import { Modal } from "./Layout";
import Router from "next/router";
import { useIdentityData } from "hooks/useIdentityData";
import { uuidToBase62 } from "src/uuidHelpers";
import { ModalNew } from "./Modal";

let weird_studios = [
  "Bauhaus",
  "Black Mountain College",
  "Roke School of Wizardry",
  "Starfleet Academy",
  "Xavier's School for Gifted Youngsters",
  "Summerhill School",
];

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
type FormState = { name: string; description: string };
export const StudioForm = ({
  formState,
  setFormState,
}: {
  formState: FormState;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
}) => {
  let example_studio = useRandomValue(weird_studios);
  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="font-bold">Name this Studio</p>
        <input
          placeholder={example_studio + "..."}
          className="w-full"
          maxLength={64}
          value={formState.name}
          onChange={(e) => {
            let value = e.currentTarget.value;
            setFormState((form) => ({
              ...form,
              name: value,
            }));
          }}
        />
        <div className="text-xs italic">{formState.name.length}/64</div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-bold">Write a short description</p>
        <textarea
          className="min-h-[128px] w-full rounded-md border border-grey-55"
          value={formState.description}
          maxLength={256}
          placeholder="write something..."
          onChange={(e) => {
            let value = e.currentTarget.value;
            setFormState((form) => ({
              ...form,
              description: value,
            }));
          }}
        />
        <div className="text-xs italic">{formState.description.length}/256</div>
      </div>
    </>
  );
};

export function CreateStudio(props: { username: string }) {
  let [open, setOpen] = useState(false);

  let { mutate } = useIdentityData(props.username);
  let [loading, setLoading] = useState(false);
  let [formState, setFormState] = useState({
    name: "",
    description: "",
  });
  let { authToken } = useAuth();
  return (
    <>
      <ButtonTertiary
        content={"Create a Studio"}
        onClick={() => setOpen(true)}
      />
      <ModalNew
        open={open}
        onClose={() => setOpen(false)}
        header="Create A New Studio"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            if (!authToken) return;
            let studio = await workerAPI(WORKER_URL, "create_studio", {
              authToken,
              ...formState,
            });
            mutate();
            if (!studio.success) return;
            setOpen(false);
            setFormState({ name: "", description: "" });
            Router.push(`/studio/${uuidToBase62(studio.data.id)}`);
          }}
        >
          <StudioForm formState={formState} setFormState={setFormState} />

          <div className="flex flex-row justify-end gap-2">
            <ButtonTertiary
              type="reset"
              content="nevermind"
              className="font-normal"
              onClick={() => setOpen(false)}
            />
            <ButtonPrimary
              type="submit"
              disabled={!formState.name}
              content={loading ? <DotLoader /> : "Create Studio!"}
            />
          </div>
        </form>
      </ModalNew>
    </>
  );
}
