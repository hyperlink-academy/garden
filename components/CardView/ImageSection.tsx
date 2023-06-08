import { useIndex, useMutations, useSpaceID } from "hooks/useReplicache";
import { useAuth } from "hooks/useAuth";
import { spaceAPI } from "backend/lib/api";
import { SectionImageAdd } from "components/Icons";
import { useEffect, useState } from "react";
import { DotLoader } from "components/DotLoader";
import { LightBoxModal } from "../Layout";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;

export const MakeImage = (props: {
  entity: string;
  children: React.ReactNode;
}) => {
  let { mutate, authorized } = useMutations();
  let image = useIndex.eav(props.entity, "card/image");
  let [imageID, setState] = useState<null | string>(null);
  useEffect(() => {
    if (imageID) {
      mutate("assertFact", {
        entity: props.entity,
        attribute: "card/image",
        value: { type: "file", id: imageID, filetype: "image" },
        positions: {},
      });
      setState(null);
    }
  }, [imageID]);

  return !authorized ? null : !image ? (
    <AddImage
      onUpload={async (imageID) => {
        setState(imageID);
        setTimeout(
          () =>
            document
              .getElementById("card-image")
              ?.scrollIntoView({ behavior: "smooth", block: "center" }),
          500
        );
      }}
    >
      {props.children}
    </AddImage>
  ) : (
    <button
      onClick={() =>
        document
          .getElementById("card-image")
          ?.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    >
      {" "}
      {props.children}{" "}
    </button>
  );
};

export const ImageSection = (props: { entityID: string }) => {
  let { session, authToken } = useAuth();
  let { mutate, authorized } = useMutations();
  let spaceID = useSpaceID();
  let image = useIndex.eav(props.entityID, "card/image");
  let [lightBoxOpen, setLightBoxOpen] = useState(false);
  return (
    // FOCUS ON DIV AND PASTE AN IMAGE
    image ? (
      <div
        id="card-image"
        className="grid auto-rows-max justify-items-center gap-1 pb-2"
      >
        <img
          className="max-w-full"
          src={
            image.value.filetype === "image"
              ? `${WORKER_URL}/static/${image.value.id}`
              : image.value.url
          }
          onClick={() => {
            setLightBoxOpen(true);
          }}
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
        {lightBoxOpen && (
          <LightBoxModal
            open={lightBoxOpen}
            onClose={() => setLightBoxOpen(false)}
          >
            <div className="relative">
              <button
                className="absolute top-0 right-0 text-grey-55 hover:text-accent-blue"
                onClick={() => {
                  setLightBoxOpen(false);
                }}
              >
                close
              </button>
              <img
                className="m-auto"
                src={
                  image.value.filetype === "image"
                    ? `${WORKER_URL}/static/${image.value.id}`
                    : image.value.url
                }
              />
            </div>
          </LightBoxModal>
        )}
      </div>
    ) : (
      <div id="card-image" />
    )
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
