import { spaceAPI } from "backend/lib/api";
import { ButtonLink } from "components/Buttons";
import { CreateStudioPost } from "components/CreateStudioPost";
import { Note } from "components/Icons";
import { ModalNew } from "components/Modal";
import { useAuth, useAuthIdentityData } from "hooks/useAuth";
import { useSpaceID } from "hooks/useReplicache";
import { useSpaceData } from "hooks/useSpaceData";
import { useState } from "react";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export function HighlightCard(props: { entityID: string }) {
  let spaceID = useSpaceID();
  let { data } = useSpaceData(spaceID);
  let { identityData } = useAuthIdentityData();
  let { authToken } = useAuth();
  let [open, setOpen] = useState(false);

  let [state, setState] = useState<"normal" | "loading" | "success">("normal");
  let sharedStudios = data?.spaces_in_studios.filter((studio) =>
    identityData?.members_in_studios.find(
      (memberStudio) => memberStudio.studios?.id === studio.studio
    )
  );
  let [selectedStudio, setSelectedStudio] = useState(0);
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
      <ModalNew width="max-w-fit" open={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-4">
          <h3>Highlight to a Studio!</h3>

          <div className="flex flex-col gap-3">
            <div>
              <p className="text-sm text-grey-55">
                Share this card to a Studio where this Space has been linked.
              </p>
            </div>
            {sharedStudios?.map((studio, index) => {
              return (
                <button
                  key={studio.studio}
                  onClick={() => {
                    setSelectedStudio(index);
                  }}
                  className={`rounded-lg border p-2 text-left font-bold hover:border-accent-blue ${
                    selectedStudio === index
                      ? "border-accent-blue bg-accent-blue text-white"
                      : "border-grey-80 bg-bg-blue"
                  }`}
                >
                  {studio.studios?.name}
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-3 rounded-md bg-bg-blue p-2 pb-28">
            <div className="w-[768px]">
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
          </div>
          <div className="flex flex-row justify-end gap-2">
            <ButtonLink content={"nevermind"} onClick={() => setOpen(false)} />
          </div>
        </div>
      </ModalNew>
    </>
  );
}
