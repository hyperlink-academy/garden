import { spaceAPI } from "backend/lib/api";
import { ButtonLink, ButtonPrimary } from "components/Buttons";
import { CreateStudioPost } from "components/CreateStudioPost";
import { DotLoader } from "components/DotLoader";
import { Checkmark, Note } from "components/Icons";
import { Modal } from "components/Layout";
import { RemoteCard } from "components/StudioPosts";
import { Textarea } from "components/Textarea";
import { useAuth } from "hooks/useAuth";
import { useIndex, useSpaceID } from "hooks/useReplicache";
import { useSpaceData } from "hooks/useSpaceData";
import { useState } from "react";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export function HighlightCard(props: { entityID: string }) {
  let spaceID = useSpaceID();
  let { data } = useSpaceData(spaceID);
  let { identityData, authToken } = useAuth();
  let [open, setOpen] = useState(false);

  let [state, setState] = useState<"normal" | "loading" | "success">("normal");
  let sharedStudios = data?.spaces_in_studios.filter((studio) =>
    identityData?.members_in_studios.find(
      (memberStudio) => memberStudio.studios?.id === studio.studio
    )
  );
  let [selectedStudio] = useState(0);
  let studio = sharedStudios?.[selectedStudio]?.studio;
  if (sharedStudios?.length === 0 || !spaceID || !studio) return null;
  return (
    <>
      <button
        className="pointer-events-auto"
        onClick={() => {
          setOpen(true);
        }}
      >
        <Note />
      </button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="flex  flex-col gap-4">
          <h3>Highlight to a studio!</h3>

          <div className="flex flex-col gap-3">
            <div>
              <p className="text-sm text-grey-55">
                You can only highlight to a studio that you share with this
                space
              </p>
            </div>
            {sharedStudios?.map((studio, index) => {
              return (
                <div
                  key={studio.studio}
                  className={`rounded-lg p-2 font-bold ${
                    selectedStudio === index
                      ? "bg-accent-blue text-white"
                      : "bg-bg-blue"
                  }`}
                >
                  {studio.studios?.name}
                </div>
              );
            })}
          </div>
          <div className="flex flex-col gap-3 rounded-md bg-bg-blue p-2 pb-28">
            <CreateStudioPost
              id={studio}
              remoteCard={{
                space_do_id: spaceID,
                cardEntity: props.entityID,
              }}
              onPost={async ({ cardPosition, contentPosition, value }) => {
                let studio = sharedStudios?.[selectedStudio];
                if (!authToken || !studio?.studios || !studio?.space) {
                  return;
                }
                setState("loading");
                let data = await spaceAPI(
                  `${WORKER_URL}/space/${studio.studios.do_id}`,
                  "post_feed_route",
                  {
                    cardPosition,
                    contentPosition,
                    authToken: authToken,
                    content: value,
                    spaceID: studio.space,
                    cardEntity: props.entityID,
                  }
                );
                if (data.success) setState("success");
                setTimeout(() => {
                  setOpen(false);
                  setState("normal");
                }, 300);
              }}
            />
          </div>
          <div className="flex flex-row justify-end gap-2">
            <ButtonLink content={"nevermind"} onClick={() => setOpen(false)} />
          </div>
        </div>
      </Modal>
    </>
  );
}
