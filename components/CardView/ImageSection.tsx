import { db, useMutations, useSpaceID } from "hooks/useReplicache";
import { useAuth } from "hooks/useAuth";
import { spaceAPI } from "backend/lib/api";
import { CloseLinedTiny } from "components/Icons";
import { useEffect, useState } from "react";
import { DotLoader } from "components/DotLoader";
import { LightBoxModal } from "../Layout";
import useMeasure from "react-use-measure";
import { Fact } from "data/Facts";
import { useIsMobile } from "hooks/utils";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;

export const MakeImage = (props: {
  entity: string;
  children: React.ReactNode;
}) => {
  let { mutate, authorized } = useMutations();
  let image = db.useEntity(props.entity, "card/image");
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
  }, [imageID, mutate, props.entity]);

  return !authorized ? null : (
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
  );
};

export const ImageSection = (props: { entityID: string }) => {
  let images = db.useEntity(props.entityID, "card/image");
  let isMobile = useIsMobile();
  return (
    <div
      className={`grid w-full ${
        isMobile ? "grid-cols-1" : "grid-cols-[min-content_auto] "
      } gap-2`}
    >
      {images?.map((image) => {
        return <Image entityID={props.entityID} fact={image} key={image.id} />;
      })}
    </div>
  );
};

export const Image = (props: {
  entityID: string;
  fact: Fact<"card/image">;
}) => {
  let { authToken } = useAuth();
  let { mutate, authorized } = useMutations();
  let spaceID = useSpaceID();
  let rotation = db.useEntity(props.fact.id || null, "image/rotation");
  let [lightBoxOpen, setLightBoxOpen] = useState(false);
  let image = props.fact;
  let src =
    image.value.filetype === "image"
      ? `${WORKER_URL}/static/${image.value.id}`
      : image.value.url;
  return (
    // FOCUS ON DIV AND PASTE AN IMAGE
    <div className="flex w-fit flex-col rounded-md border border-grey-80 p-1">
      <div
        id="card-image"
        style={{
          height: 256,
          width: 256,
        }}
        className="group relative flex grid w-full auto-rows-max items-center justify-center justify-items-center gap-1 "
      >
        <img
          alt=""
          className="h-full w-full rounded-md hover:cursor-pointer"
          src={
            image.value.filetype === "image"
              ? `${WORKER_URL}/static/${image.value.id}`
              : image.value.url
          }
          style={{
            position: "absolute",
            objectFit: "contain",
            transformOrigin: "center",
            transform: `rotate(${90 * (rotation?.value || 0)}deg)`,
          }}
          onClick={() => {
            setLightBoxOpen(true);
          }}
        />

        {lightBoxOpen && (
          <LightBoxModal
            open={lightBoxOpen}
            onClose={() => setLightBoxOpen(false)}
          >
            <div className="relative">
              <button
                className="bg-white/ absolute right-4 top-4 rounded-full bg-white/90 p-1 text-grey-55 hover:text-accent-blue"
                onClick={() => {
                  setLightBoxOpen(false);
                }}
              >
                <CloseLinedTiny />
              </button>
              <img
                alt=""
                className="m-auto"
                style={{
                  transform: `rotate(${90 * (rotation?.value || 0)}deg)`,
                }}
                src={src}
              />
            </div>
          </LightBoxModal>
        )}
      </div>
      {!authorized ? null : (
        <div className="flex w-full justify-center justify-items-center gap-2">
          <button
            className="text-sm text-grey-55 hover:text-accent-blue"
            onClick={() => {
              if (!authToken) return;
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
          <button
            className="text-sm text-grey-55 hover:text-accent-blue"
            onClick={() => {
              mutate("assertFact", {
                entity: image.id,
                attribute: "image/rotation",
                value: ((rotation?.value || 0) + 1) % 4,
                positions: {},
              });
            }}
          >
            rotate
          </button>
        </div>
      )}
    </div>
  );
};

export const AddImage: React.FC<
  React.PropsWithChildren<{ onUpload: (imageID: string) => void }>
> = (props) => {
  let { session, authToken } = useAuth();
  let spaceID = useSpaceID();
  let [state, setState] = useState<"normal" | "uploading">("normal");

  return (
    <label className="inline-block h-full w-full cursor-pointer text-grey-55 hover:text-accent-blue">
      {state === "normal" ? (
        props.children
      ) : (
        <div className="mx-auto flex h-full w-max place-items-center text-center ">
          <DotLoader />
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        multiple
        onClick={() => {
          console.log("what");
        }}
        onChange={async (e) => {
          let files = e.currentTarget.files;
          if (!files || !authToken || !spaceID) return;
          setState("uploading");
          for (let file of files) {
            let res = await fetch(
              `${WORKER_URL}/space/${spaceID}/upload_file`,
              {
                headers: {
                  "X-Authorization-Access-Token": authToken.access_token,
                  "X-Authorization-Refresh-Token": authToken.refresh_token,
                },
                method: "POST",
                body: file,
              }
            );
            let data = (await res.json()) as
              | { success: false }
              | { success: true; data: { id: string } };
            if (!data.success) return;
            props.onUpload(data.data.id);
          }

          setState("normal");
        }}
      />
    </label>
  );
};
