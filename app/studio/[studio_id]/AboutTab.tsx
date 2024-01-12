import { spaceAPI } from "backend/lib/api";
import { AddImage } from "components/CardView/ImageSection";
import { CloseLinedTiny, SectionImageAdd } from "components/Icons";
import { Divider } from "components/Layout";
import { Textarea } from "components/Textarea";
import { useAuth } from "hooks/useAuth";
import { db, useMutations, useSpaceID } from "hooks/useReplicache";
import { WORKER_URL } from "src/constants";

export function About() {
  let home = db.useAttribute("home")[0];
  let homeContent = db.useEntity(home?.entity, "card/content");
  let image = db.useEntity(home?.entity, "card/image");
  let { mutate } = useMutations();
  let { authToken } = useAuth();
  let spaceID = useSpaceID();
  return (
    <div className="mx-auto h-full max-w-2xl  pb-6 sm:pt-6">
      <div className="relative h-full">
        {!image && (
          <div className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-md border border-grey-80 bg-white p-1 text-accent-blue sm:-top-4">
            <AddImage
              onUpload={(imageID) => {
                if (!home) return;
                mutate("assertFact", {
                  entity: home.entity,
                  attribute: "card/image",
                  value: { type: "file", id: imageID, filetype: "image" },
                  positions: {},
                });
              }}
            >
              <SectionImageAdd />
            </AddImage>
          </div>
        )}
        <div className="no-scrollbar flex h-full flex-col gap-2 overflow-scroll rounded-lg border border-grey-80 bg-white p-4 text-lg">
          {image && (
            <div className="relative">
              <img
                alt=""
                className="max-w-full rounded-md hover:cursor-pointer"
                src={
                  image.value.filetype === "image"
                    ? `${WORKER_URL}/static/${image.value.id}`
                    : image.value.url
                }
              />
              <button
                className=" absolute right-3 top-3 w-fit rounded-full border border-grey-80 bg-white p-1 text-grey-55 hover:border-accent-blue hover:bg-bg-blue hover:text-accent-blue"
                onClick={() => {
                  if (!image || !authToken) return;
                  mutate("retractFact", { id: image.id });
                  if (image.value.filetype === "external_image") return;
                  spaceAPI(
                    `${WORKER_URL}/space/${spaceID}`,
                    "delete_file_upload",
                    {
                      authToken,
                      fileID: image.value.id,
                    }
                  );
                }}
              >
                <CloseLinedTiny />
              </button>
            </div>
          )}
          <Textarea
            id="studio-about"
            placeholder="write a readme…"
            value={homeContent?.value}
            onChange={(e) => {
              if (!home) return;
              mutate("assertFact", {
                positions: {},
                attribute: "card/content",
                value: e.currentTarget.value,
                entity: home?.entity,
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}
