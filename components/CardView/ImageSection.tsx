import { useIndex, useMutations, useSpaceID } from "hooks/useReplicache";
import { useAuth } from "hooks/useAuth";
import { spaceAPI } from "backend/lib/api";
import { SectionImageAdd } from "components/Icons";
const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;

export const ImageSection = (props: { entity: string }) => {
  let { session } = useAuth();
  let { mutate } = useMutations();
  let spaceID = useSpaceID();
  let image = useIndex.eav(props.entity, "card/image");
  return (
    // FOCUS ON DIV AND PASTE AN IMAGE
    image ? (
      <div className="grid auto-rows-max justify-items-center gap-1">
        <img
          className="max-w-full   "
          src={`${WORKER_URL}/static/${image.value.id}`}
        />
        <button
          className="text-grey-55 text-sm justify-self-center hover:text-accent-blue"
          onClick={() => {
            if (!image || !session.token) return;
            mutate("retractFact", { id: image.id });
            spaceAPI(`${WORKER_URL}/space/${spaceID}`, "delete_file_upload", {
              token: session.token,
              fileID: image.value.id,
            });
          }}
        >
          remove
        </button>
      </div>
    ) : (
      // <div
      //   onPaste={async (e) => {
      //     let items = e.clipboardData.items;
      //     if (!items[0].type.includes("image") || !session.session) return;
      //     let image = items[0].getAsFile();
      //     if (!image) return;

      //     let res = await fetch(`${WORKER_URL}/space/${spaceID}/upload_file`, {
      //       headers: {
      //         "X-Authorization": session.session.id,
      //       },
      //       method: "POST",
      //       body: image,
      //     });
      //     let data = (await res.json()) as
      //       | { success: false }
      //       | { success: true; data: { id: string } };
      //     if (!data.success) return;
      //     await mutate("assertFact", {
      //       entity: props.entity,
      //       attribute: "card/image",
      //       value: { type: "file", id: data.data.id, filetype: "image" },
      //       positions: {},
      //     });
      //   }}
      // >

      <label className="inline-block w-max text-grey-55 hover:text-accent-blue pt-2">
        <SectionImageAdd />
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            let files = e.currentTarget.files;
            if (!files || !session.session || !spaceID) return;
            let res = await fetch(
              `${WORKER_URL}/space/${spaceID}/upload_file`,
              {
                headers: {
                  "X-Authorization": session.session.id,
                },
                method: "POST",
                body: files[0],
              }
            );
            let data = (await res.json()) as
              | { success: false }
              | { success: true; data: { id: string } };
            if (!data.success) return;
            await mutate("assertFact", {
              entity: props.entity,
              attribute: "card/image",
              value: { type: "file", id: data.data.id, filetype: "image" },
              positions: {},
            });
          }}
        />
      </label>
      // </div>
    )
  );
};
