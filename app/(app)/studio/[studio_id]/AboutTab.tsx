import { spaceAPI } from "backend/lib/api";
import { AddImage } from "components/CardView/ImageSection";
import { CloseLinedTiny, SectionImageAdd } from "components/Icons";
import { Divider } from "components/Layout";
import { Textarea } from "components/Textarea";
import { useAuth } from "hooks/useAuth";
import { db, useMutations, useSpaceID } from "hooks/useReplicache";
import { WORKER_URL } from "src/constants";

export function About(props: { isAdmin: boolean }) {
  let home = db.useAttribute("home")[0];
  let homeContent = db.useEntity(home?.entity, "card/content");
  let image = db.useEntity(home?.entity, "card/image")?.[0];
  let { mutate } = useMutations();
  let { authToken } = useAuth();
  let authorized = props.isAdmin;
  let spaceID = useSpaceID();
  return (
    <div className="h-full w-full max-w-3xl ">
      <div className="relative h-full">
        {!image && authorized && (
          <div className="border-grey-80 text-accent-blue absolute right-3 top-3 z-10 flex items-center gap-2 rounded-md border bg-white p-1">
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
        <div className="no-scrollbar border-grey-80 flex h-full flex-col gap-2 overflow-scroll rounded-lg border bg-white p-3 sm:p-4 sm:text-lg">
          {image && (
            <div className="relative pb-2">
              <img
                alt=""
                className="max-w-full rounded-md hover:cursor-pointer"
                src={
                  image.value.filetype === "image"
                    ? `${WORKER_URL}/static/${image.value.id}`
                    : image.value.url
                }
              />
              {authorized && (
                <button
                  className=" border-grey-80 text-grey-55 hover:border-accent-blue hover:bg-bg-blue hover:text-accent-blue absolute right-3 top-3 w-fit rounded-full border bg-white p-1"
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
              )}
            </div>
          )}
          <Textarea
            id="studio-about"
            placeholder="write a readme…"
            previewOnly={!authorized}
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
