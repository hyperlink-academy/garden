import { spaceAPI } from "backend/lib/api";
import { Fact } from "data/Facts";
import { useAuth } from "hooks/useAuth";
import { useSpaceID } from "hooks/useReplicache";
import { AddImage } from "./CardView/ImageSection";
import { DoorClippedImage } from "./Doors";
import { SectionImageAdd } from "./Icons";
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
}) => {
  let spaceID = useSpaceID();
  let { authToken } = useAuth();

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
      <div className="grid grid-cols-[repeat(auto-fill,64px)] gap-0 sm:grid-cols-[repeat(auto-fill,96px)]">
        {defaultDoorImages.map((f) => {
          return (
            <button
              key={f}
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
              <DoorClippedImage url={f} width="64" />
            </button>
          );
        })}
        {props.selected && !defaultDoorImages.includes(props.selected) ? (
          <DoorClippedImage url={`${WORKER_URL}/static/${props.selected}`} />
        ) : null}
      </div>
      <div>
        <AddImage
          onUpload={(imageID) => {
            if (props.selected && !defaultDoorImages.includes(props.selected))
              cleanup(props.selected);
            props.onSelect({ type: "file", filetype: "image", id: imageID });
          }}
        >
          <div className="flex gap-2">
            <p className="">Upload a custom image!</p>
            <SectionImageAdd />
          </div>
        </AddImage>
      </div>
    </div>
  );
};
