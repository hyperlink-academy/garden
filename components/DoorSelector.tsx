import { spaceAPI } from "backend/lib/api";
import { useAuth } from "hooks/useAuth";
import { useSpaceID } from "hooks/useReplicache";
import { AddImage } from "./CardView/ImageSection";
import { DoorClippedImage } from "./Doors";
import { SectionImageAdd } from "./Icons";

let doorImages: string[] = [
  "/doors/door-clouds-256.jpg",
  "/doors/door-chicken-256.jpg",
  "/doors/door-field-256.jpg",
  "/doors/door-windowseat-256.jpg",
];

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;

export type Door = { type: "default" | "uploaded"; value: string };
export const DoorSelector = (props: {
  onSelect: (s: Door) => void;
  selected?: Door;
}) => {
  let spaceID = useSpaceID();
  let { session } = useAuth();

  const cleanup = (id: string) => {
    if (!session.token) return;
    spaceAPI(`${WORKER_URL}/space/${spaceID}`, "delete_file_upload", {
      token: session.token,
      fileID: id,
    });
  };
  return (
    <div className="w-full flex flex-col gap-0">
      <p className="font-bold">Set the Scenery</p>
      <div className="grid grid-cols-[repeat(auto-fill,96px)] gap-0">
        {doorImages.map((f) => {
          return (
            <button
              className={`${props.selected?.value === f ? "" : "opacity-50"}`}
              onClick={() => {
                if (props.selected?.type === "uploaded")
                  cleanup(props.selected.value);
                props.onSelect({ type: "default", value: f });
              }}
            >
              <DoorClippedImage url={f} />
            </button>
          );
        })}
        {props.selected?.type === "uploaded" ? (
          <DoorClippedImage
            url={`${WORKER_URL}/static/${props.selected.value}`}
          />
        ) : null}
      </div>
      <div>
        <p className="pb-2">Upload a custom image!</p>
        <p className="text-sm pb-2">
          Crop to 256 x 576 px. Try{" "}
          <a
            href="https://museo.app/"
            className="text-accent-blue"
            target="_blank"
          >
            Museuo
          </a>{" "}
          for inspiration :)
        </p>
        <AddImage
          onUpload={(imageID) => {
            if (props.selected?.type === "uploaded")
              cleanup(props.selected.value);
            props.onSelect({ type: "uploaded", value: imageID });
          }}
        >
          <SectionImageAdd />
        </AddImage>
      </div>
    </div>
  );
};
