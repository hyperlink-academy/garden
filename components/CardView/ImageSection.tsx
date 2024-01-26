import { db, useMutations, useSpaceID } from "hooks/useReplicache";
import { useAuth } from "hooks/useAuth";
import { spaceAPI } from "backend/lib/api";
import {
  CloseLinedTiny,
  GoBackToPageLined,
  RotateTiny,
} from "components/Icons";
import { useEffect, useState } from "react";
import { DotLoader } from "components/DotLoader";
import { LightBoxModal } from "../Layout";
import { Fact } from "data/Facts";
import useMeasure from "react-use-measure";

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
  let [lightBoxOpen, setLightBoxOpen] = useState(false);
  let [selectedImage, setSelectedImage] = useState<Fact<"card/image"> | null>(
    null
  );

  return (
    <div
      className={`flex w-full flex-col gap-3 sm:gap-4
    `}
    >
      {images?.map((image) => {
        return (
          <CardImage
            entityID={props.entityID}
            fact={image}
            key={image.id}
            onClick={() => {
              setLightBoxOpen(true);
              setSelectedImage(image);
            }}
          />
        );
      })}
      <ImageLightbox
        lightBoxOpen={lightBoxOpen}
        setLightBoxClosed={() => setLightBoxOpen(false)}
        entityID={props.entityID}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
      />
    </div>
  );
};

export const ImageLightbox = (props: {
  lightBoxOpen: boolean;
  setSelectedImage: (image: Fact<"card/image">) => void;
  selectedImage: Fact<"card/image"> | null;
  setLightBoxClosed: () => void;
  entityID: string;
}) => {
  let rotation = db.useEntity(
    props.selectedImage?.id || null,
    "image/rotation"
  );
  let images = db.useEntity(props.entityID, "card/image") || [];
  let currentImageIndex = images?.findIndex(
    (image) => image.id === props.selectedImage?.id
  );
  if (!props.lightBoxOpen || !props.selectedImage) return null;

  let src =
    props.selectedImage.value.filetype === "image"
      ? `${WORKER_URL}/static/${props.selectedImage.value.id}`
      : props.selectedImage.value.url;

  return (
    <LightBoxModal
      open={props.lightBoxOpen}
      onClose={() => props.setLightBoxClosed()}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between ">
          <button
            className="text-grey-55 hover:text-accent-blue bg-white-90  rounded-full bg-white p-1"
            onClick={() => {
              props.setLightBoxClosed();
            }}
          >
            <CloseLinedTiny />
          </button>
          <div className="flex gap-2">
            <button
              className="text-grey-55 hover:text-accent-blue"
              onClick={() => {
                props.setSelectedImage(
                  images[
                    currentImageIndex === 0
                      ? images.length - 1
                      : currentImageIndex - 1
                  ]
                );
              }}
            >
              <GoBackToPageLined />
            </button>
            <div className="text-grey-55 text-sm font-bold">
              <sup>{currentImageIndex + 1}</sup>/<sub>{images.length}</sub>
            </div>
            <button
              className="text-grey-55 hover:text-accent-blue rotate-180"
              onClick={() => {
                props.setSelectedImage(
                  images[
                    currentImageIndex === images.length - 1
                      ? 0
                      : currentImageIndex + 1
                  ]
                );
              }}
            >
              {" "}
              <GoBackToPageLined />
            </button>
          </div>
        </div>
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
  );
};

export const CardImage = (props: {
  entityID: string;
  fact: Fact<"card/image">;
  onClick: () => void;
}) => {
  let rotation = db.useEntity(props.fact.id || null, "image/rotation");
  let image = props.fact;
  let [imageRef, { width: imageWidth }] = useMeasure();
  let rot = rotation?.value || 0;

  return (
    // FOCUS ON DIV AND PASTE AN IMAGE
    <div className="relative flex w-full flex-col rounded-md ">
      <div
        id="card-image"
        ref={imageRef}
        style={{
          width: "100%",
          position: "relative",
        }}
        className="group relative  w-full auto-rows-max items-center justify-center justify-items-center gap-1 "
      >
        <img
          onClick={props.onClick}
          alt=""
          className="rounded-md hover:cursor-pointer"
          src={
            image.value.filetype === "image"
              ? `${WORKER_URL}/static/${image.value.id}`
              : image.value.url
          }
          style={{
            objectFit: "contain",
            transformOrigin: "center",
            transform: `rotate(${90 * (rotation?.value || 0)}deg)`,
            height: rot % 2 === 0 ? "auto" : imageWidth,
            width: rot % 2 === 0 ? "100%" : "auto",
          }}
        />
      </div>
      <div className="imageOptionsWrapper absolute right-2 top-2">
        <ImageOptions fact={props.fact} />
      </div>
    </div>
  );
};

export const ImageOptions = (props: { fact: Fact<"card/image"> }) => {
  let { authToken } = useAuth();
  let { mutate, authorized } = useMutations();
  let spaceID = useSpaceID();
  let rotation = db.useEntity(props.fact.id || null, "image/rotation");
  let rot = rotation?.value || 0;
  let image = props.fact;

  if (!authorized) return null;

  return (
    <div className="imageOptions flex w-full justify-center justify-items-center gap-2">
      <button
        className="text-grey-55 hover:text-accent-blue boder-grey-80 hover:border-text-blue hover:bg-bg-blue flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-white text-sm"
        onClick={() => {
          mutate("assertFact", {
            entity: image.id,
            attribute: "image/rotation",
            value: (rot + 1) % 4,
            positions: {},
          });
        }}
      >
        <RotateTiny />
      </button>
      <button
        className="text-grey-55 hover:text-accent-blue boder-grey-80 hover:border-text-blue hover:bg-bg-blue flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-white text-sm"
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
        <CloseLinedTiny />
      </button>
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
    <label className="text-grey-55 hover:text-accent-blue inline-block h-full w-full cursor-pointer">
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
