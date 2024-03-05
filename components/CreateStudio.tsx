import { workerAPI } from "backend/lib/api";
import { ButtonLink, ButtonPrimary, ButtonTertiary } from "components/Buttons";
import { useAuth } from "hooks/useAuth";
import { useRandomValue } from "hooks/useRandomValue";
import { useState } from "react";
import { DotLoader } from "./DotLoader";
import { useIdentityData } from "hooks/useIdentityData";
import { uuidToBase62 } from "src/uuidHelpers";
import { Modal } from "./Modal";
import { useRouter } from "next/navigation";

let weird_studios = [
  "Bauhaus",
  "Black Mountain College",
  "Roke School of Wizardry",
  "Starfleet Academy",
  "Xavier's School for Gifted Youngsters",
  "Summerhill School",
];

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
type FormState = {
  name: string;
  description: string;
  allow_members_to_join_spaces: boolean;
};
const StudioNameForm = ({
  formState,
  setFormState,
}: {
  formState: FormState;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
}) => {
  let example_studio = useRandomValue(weird_studios);
  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="font-bold">Name this Studio</p>
        <div className="flex flex-col gap-0.5">
          <input
            placeholder={example_studio + "…"}
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
          <div className="text-grey-55 text-xs italic">
            {formState.name.length}/64
          </div>
        </div>
      </div>
    </>
  );
};

export function CreateStudio(props: { username: string }) {
  let [open, setOpen] = useState(false);

  let { mutate } = useIdentityData(props.username);
  let [loading, setLoading] = useState(false);
  let [formState, setFormState] = useState<FormState>({
    name: "",
    description: "",
    allow_members_to_join_spaces: false,
  });
  let { authToken } = useAuth();
  let router = useRouter();
  return (
    <>
      <ButtonLink content={"Create"} onClick={() => setOpen(true)} />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        header="Create New Studio"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!authToken) return;
            setLoading(true);
            let studio = await workerAPI(WORKER_URL, "create_studio", {
              authToken,
              ...formState,
            });
            console.log(studio);
            mutate();
            setLoading(false);
            if (!studio.success) return;
            setOpen(false);
            setFormState({
              name: "",
              description: "",
              allow_members_to_join_spaces: false,
            });
            router.push(`/studio/${uuidToBase62(studio.data.id)}`);
          }}
        >
          <StudioNameForm formState={formState} setFormState={setFormState} />

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
      </Modal>
    </>
  );
}
