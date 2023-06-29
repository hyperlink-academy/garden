import { spaceAPI } from "backend/lib/api";
import { ButtonLink, ButtonPrimary } from "components/Buttons";
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
  let [messageContent, setMessageContent] = useState("");

  let [state, setState] = useState<"normal" | "loading" | "success">("normal");
  let sharedStudios = data?.spaces_in_studios.filter((studio) =>
    identityData?.members_in_studios.find(
      (memberStudio) => memberStudio.studios?.id === studio.studio
    )
  );
  let [selectedStudio] = useState(0);
  if (sharedStudios?.length === 0) return null;
  return (
    <>
      <button
        className="pointer-events-auto"
        onClick={() => {
          console.log("Yooo");
          setOpen(true);
        }}
      >
        <Note />
      </button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-4">
          <h3>Highlight!</h3>
          <div className="flex flex-col gap-3 rounded-md bg-bg-blue p-2">
            <div className="flex flex-row gap-3">
              <LocalRemoteCard entityID={props.entityID} />
            </div>
            <Textarea
              placeholder={"Add a message..."}
              className="rounded-md border border-grey-55 bg-white p-2"
              value={messageContent}
              onChange={(e) => setMessageContent(e.currentTarget.value)}
            />
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <h3>Studio</h3>
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
          <div className="flex flex-row justify-end gap-2">
            <ButtonLink content={"nevermind"} onClick={() => setOpen(false)} />
            <ButtonPrimary
              content={
                state === "normal" ? (
                  "Highlight"
                ) : state === "loading" ? (
                  <DotLoader />
                ) : (
                  <Checkmark />
                )
              }
              onClick={async () => {
                let studio = sharedStudios?.[selectedStudio];
                if (!authToken || !studio?.studios || !studio?.space) {
                  return;
                }
                setState("loading");
                let data = await spaceAPI(
                  `${WORKER_URL}/space/${studio.studios.do_id}`,
                  "post_feed_route",
                  {
                    authToken: authToken,
                    content: messageContent,
                    spaceID: studio.space,
                    cardEntity: props.entityID,
                  }
                );
                if (data.success) setState("success");
                setTimeout(() => {
                  setOpen(false);
                  setMessageContent("");
                  setState("normal");
                }, 300);
              }}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}

const LocalRemoteCard = (props: { entityID: string }) => {
  let title = useIndex.eav(props.entityID, "card/title");
  let content = useIndex.eav(props.entityID, "card/content");
  let creator = useIndex.eav(props.entityID, "card/created-by");
  let creatorName = useIndex.eav(creator?.value.value || null, "member/name");

  return (
    <RemoteCard
      title={title?.value}
      content={content?.value}
      creator={creatorName?.value}
    />
  );
};
