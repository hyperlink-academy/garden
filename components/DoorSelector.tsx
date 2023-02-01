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
  selected?: Door;
}) => {
  let spaceID = useSpaceID();
  let { session } = useAuth();
  console.log(props.selected);

  const cleanup = (id: string) => {
    if (!session.token) return;
    spaceAPI(`${WORKER_URL}/space/${spaceID}`, "delete_file_upload", {
      token: session.token,
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
              className={`${
                props.selected?.filetype === "external_image" &&
                props.selected?.url === f
                  ? ""
                  : "opacity-50"
              }`}
              onClick={() => {
                if (props.selected?.filetype === "image")
                  cleanup(props.selected.id);
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
        {props.selected?.filetype === "image" ? (
          <DoorClippedImage url={`${WORKER_URL}/static/${props.selected.id}`} />
        ) : null}
      </div>
      <div>
        <p className="pb-2">Upload a custom image!</p>
        <p className="pb-2 text-sm">
          Crop to 256 x 576 px. Try{" "}
          <a
            href="https://museo.app/"
            className="text-accent-blue"
            target="_blank"
          >
            Museo
          </a>{" "}
          for inspo :)
        </p>
        <AddImage
          onUpload={(imageID) => {
            if (props.selected?.filetype === "image")
              cleanup(props.selected.id);
            props.onSelect({ type: "file", filetype: "image", id: imageID });
          }}
        >
          <SectionImageAdd />
        </AddImage>
      </div>
    </div>
  );
};
