import { useIndex, useMutations, useSpaceID } from "hooks/useReplicache";
import { useAuth } from "hooks/useAuth";
import { spaceAPI } from "backend/lib/api";
import { SectionImageAdd } from "components/Icons";
import { useState } from "react";
import { DotLoader } from "components/DotLoader";
const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;

export const MakeImage = (props: { entity: string }) => {
  let { mutate, authorized } = useMutations();
  let image = useIndex.eav(props.entity, "card/image");

  return !authorized || image ? null : (
    <AddImage
      onUpload={async (imageID) => {
        await mutate("assertFact", {
          entity: props.entity,
          attribute: "card/image",
          value: { type: "file", id: imageID, filetype: "image" },
          positions: {},
        });
      }}
    >
      <SectionImageAdd />
    </AddImage>
  );
};

export const ImageSection = (props: { entityID: string }) => {
  let { session, authToken } = useAuth();
  let { mutate, authorized } = useMutations();
  let spaceID = useSpaceID();
  let image = useIndex.eav(props.entityID, "card/image");
  return (
    // FOCUS ON DIV AND PASTE AN IMAGE
    image ? (
      <div className="grid auto-rows-max justify-items-center gap-1 pb-2">
        <img
          className="max-w-full"
          src={
            image.value.filetype === "image"
              ? `${WORKER_URL}/static/${image.value.id}`
              : image.value.url
          }
        />
        {!authorized ? null : (
          <button
            className="justify-self-center text-sm text-grey-55 hover:text-accent-blue"
            onClick={() => {
              if (!image || !authToken) return;
              mutate("retractFact", { id: image.id });
              if (image.value.filetype === "external_image") return;
              spaceAPI(`${WORKER_URL}/space/${spaceID}`, "delete_file_upload", {
                authToken,
                fileID: image.value.id,
              });
            }}
          >
            remove
          </button>
        )}
      </div>
    ) : null
  );
};

export const AddImage: React.FC<
  React.PropsWithChildren<{ onUpload: (imageID: string) => void }>
> = (props) => {
  let { session, authToken } = useAuth();
  let spaceID = useSpaceID();
  let [state, setState] = useState<"normal" | "uploading">("normal");

  return (
    <label className="inline-block w-max cursor-pointer text-grey-55 hover:text-accent-blue">
      {state === "normal" ? props.children : <DotLoader />}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          let files = e.currentTarget.files;
          if (!files || !authToken || !spaceID) return;
          setState("uploading");
          let res = await fetch(`${WORKER_URL}/space/${spaceID}/upload_file`, {
            headers: {
              "X-Authorization-Access-Token": authToken.access_token,
              "X-Authorization-Refresh-Token": authToken.refresh_token,
            },
            method: "POST",
            body: files[0],
          });
          setState("normal");
          let data = (await res.json()) as
            | { success: false }
            | { success: true; data: { id: string } };
          if (!data.success) return;
          props.onUpload(data.data.id);
        }}
      />
    </label>
  );
};
