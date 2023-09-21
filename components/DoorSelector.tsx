import { spaceAPI } from "backend/lib/api";
import { Fact } from "data/Facts";
import { useAuth } from "hooks/useAuth";
import { useSpaceID } from "hooks/useReplicache";
import { AddImage } from "./CardView/ImageSection";
import { DoorClippedImage, DoorImage, EmptyDoor } from "./Doors";
import { SectionImageAdd } from "./Icons";
import { useState } from "react";
export const defaultDoorImages: string[] = [
  "/doors/door-clouds-256.jpg",
  "/doors/door-chicken-256.jpg",
  "/doors/door-field-256.jpg",
  "/doors/door-windowseat-256.jpg",
];

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;

export type Door = Fact<"space/door/uploaded-image">["value"];
export const DoorSelector = (props: {
  onSelect: (s: Door) => void;
  selected?: string | null;
  uploadedImage: string | null;
}) => {
  let spaceID = useSpaceID();
  let { authToken } = useAuth();
  let [uploadedImage, setUploadedImage] = useState(props.uploadedImage);

  const cleanup = (id: string) => {
    if (!authToken) return;
    spaceAPI(`${WORKER_URL}/space/${spaceID}`, "delete_file_upload", {
      authToken,
      fileID: id,
    });
  };

  return (
    <div className="flex w-full flex-col gap-0">
      <p className="font-bold">Set the Scenery</p>
      <div className="flex w-full flex-wrap  justify-between gap-2">
        {defaultDoorImages.map((f) => {
          return (
            <button
              key={f}
              type="button"
              className={`${props.selected === f ? "" : "opacity-50"}`}
              onClick={() => {
                if (
                  props.selected &&
                  !defaultDoorImages.includes(props.selected)
                )
                  cleanup(props.selected);
                props.onSelect({
                  type: "file",
                  filetype: "external_image",
                  url: f,
                });
              }}
            >
              {props.selected === f ? (
                <DoorImage default_space_image={f} width="64" />
              ) : (
                <DoorClippedImage url={f} width="64" />
              )}
            </button>
          );
        })}
        {uploadedImage ? (
          <div className="h-[144px] w-16">
            <AddImage
              onUpload={(imageID) => {
                if (
                  props.selected &&
                  !defaultDoorImages.includes(props.selected)
                )
                  cleanup(props.selected);
                props.onSelect({
                  type: "file",
                  filetype: "image",
                  id: imageID,
                });
              }}
            >
              {props.selected && !defaultDoorImages.includes(props.selected) ? (
                <DoorImage image={`${props.selected}`} width="64" />
              ) : (
                <DoorClippedImage
                  url={`${WORKER_URL}/static/${uploadedImage}`}
                  width="64"
                />
              )}
            </AddImage>
          </div>
        ) : (
          <div>
            <div className="h-[144px] w-16">
              <AddImage
                onUpload={(imageID) => {
                  if (
                    props.selected &&
                    !defaultDoorImages.includes(props.selected)
                  )
                    cleanup(props.selected);
                  props.onSelect({
                    type: "file",
                    filetype: "image",
                    id: imageID,
                  });
                  setUploadedImage(imageID);
                }}
              >
                <EmptyDoor width="64" />
              </AddImage>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
