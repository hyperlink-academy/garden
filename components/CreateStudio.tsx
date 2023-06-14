import { workerAPI } from "backend/lib/api";
import { ButtonLink, ButtonPrimary, ButtonTertiary } from "components/Buttons";
import { useAuth } from "hooks/useAuth";
import { useRandomValue } from "hooks/useRandomValue";
import { useState } from "react";
import { DotLoader } from "./DotLoader";
import { Modal } from "./Layout";
import Router from "next/router";
import { Textarea } from "./Textarea";

let wierd_studios = [
  "Bauhaus",
  "Black Mountain College",
  "Roke",
  "Starfleet Academy",
  "Xavier's School for Gifted Youngsters}",
];

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export function CreateStudio() {
  let [open, setOpen] = useState(false);
  let [loading, setLoading] = useState(false);
  let [formState, setFormState] = useState({
    name: "",
    description: "",
  });
  let { authToken } = useAuth();
  let example_studio = useRandomValue(wierd_studios);
  return (
    <>
      <ButtonTertiary
        content={"Create a Studio"}
        onClick={() => setOpen(true)}
      />
      <Modal open={open} onClose={() => setOpen(false)}>
        <form
          className="flex flex-col gap-8"
          onSubmit={async (e) => {
            if (!authToken) return;
            e.preventDefault();
            setLoading(true);
            let studio = await workerAPI(WORKER_URL, "create_studio", {
              authToken,
              ...formState,
            });
            setLoading(false);
            if (!studio.success) return;
            Router.push(`/studio/${studio.data.id}`);
          }}
        >
          <div className="flex flex-col gap-2">
            <p className="font-bold">Name this Studio</p>
            <input
              placeholder={example_studio + "..."}
              className="w-full"
              value={formState.name}
              onChange={(e) => {
                let value = e.currentTarget.value;
                setFormState((form) => ({
                  ...form,
                  name: value,
                }));
              }}
            />
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

            <div className="text-xs italic">
              {formState.description.length}/256
            </div>
          </div>
          <div className="flex flex-row justify-end gap-4">
            <ButtonLink content="nevermind" className="font-normal" />
            <ButtonPrimary
              disabled={!formState.name}
              content={loading ? <DotLoader /> : "Create Studio!"}
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
