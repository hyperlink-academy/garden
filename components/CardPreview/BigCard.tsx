import { Backlinks } from "components/CardView/Backlinks";
import { SingleTextSection } from "components/CardView/Sections";
import { useCardViewer } from "components/CardViewerContext";
import { GripperBG } from "components/Gripper";
import { GoToPage } from "components/Icons";
import { useAuth } from "hooks/useAuth";
import { useIndex, useMutations, useSpaceID } from "hooks/useReplicache";
import { Props } from "./index";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export const BigCardBody = (props: { entityID: string } & Props) => {
  let isMember = !!useIndex.eav(props.entityID, "member/name");
  let { session } = useAuth();
  let spaceID = useSpaceID();
  let image = useIndex.eav(props.entityID, "card/image");
  let { mutate, authorized } = useMutations();

  let { open } = useCardViewer();

  let imageUrl = !image
    ? undefined
    : image.value.filetype === "image"
    ? `${WORKER_URL}/static/${image.value.id}`
    : image.value.url;

  return (
    <div
      className={`CardPreivewContent flex h-full grow flex-row overflow-hidden pl-0  ${
        isMember ? "py-2 pr-2" : "py-2 pr-3"
      }`}
      style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
    >
      {/* Gripper  */}
      <div className="cardPreviewGripper pl-1 pr-2 text-grey-80">
        {authorized && props.dragHandleProps ? (
          <div className="h-full">
            <GripperBG
              {...props.dragHandleProps.attributes}
              {...props.dragHandleProps.listeners}
            />
          </div>
        ) : (
          <div />
        )}
      </div>

      {/* Big Card Preview Content Wrapper */}
      <div className="cardPreview flex w-full flex-col">
        {/* Big Card Preview Title and GoTo Button*/}
        <div className={`cardPreviewHeader flex gap-2`}>
          <SingleTextSection
            entityID={props.entityID}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                let element = document.getElementById(
                  `${props.entityID}-${props.factID}-text-section`
                );
                element?.focus();
              }
            }}
            previewOnly={isMember}
            section={isMember ? "member/name" : "card/title"}
            placeholderOnHover={true}
            placeholder="Untitled"
            className={`cardPreviewTitle text-md grow font-bold ${
              isMember ? "text-white" : "text-grey-35"
            } ${!image ? "" : "rounded-[3px] bg-white/75 px-1"}`}
          />
          {isMember ? <div className="shrink-0 text-white">member</div> : ""}
          <div
            onClick={() => {
              let cardView = document.getElementById("cardViewerWrapper");
              open({ entityID: props.entityID });
              cardView ? cardView.scrollIntoView({ behavior: "smooth" }) : null;
            }}
            className="cardPreviewGoTo pt-1 hover:cursor-pointer"
          >
            <a className={`${isMember ? "text-white" : "text-accent-blue"}`}>
              <GoToPage />
            </a>
          </div>
        </div>
        {props.showRelated && <Backlinks entityID={props.entityID} />}

        {/* Big Card Preview Default Content */}
        <div
          className={` cardPreviewDefaultContent ${
            isMember ? "mt-1 rounded-md bg-white p-2 pt-1 text-accent-red" : ""
          }`}
        >
          {!image ? null : (
            <img
              src={`${imageUrl}`}
              className="max-h-[600px] max-w-full  py-2 px-1"
            />
          )}
          <SingleTextSection
            id={`${props.entityID}-${props.factID}-text-section`}
            entityID={props.entityID}
            onPaste={async (e) => {
              let items = e.clipboardData.items;
              if (!items[0].type.includes("image") || !session.session) return;
              let image = items[0].getAsFile();
              if (!image) return;

              let res = await fetch(
                `${WORKER_URL}/space/${spaceID}/upload_file`,
                {
                  headers: {
                    "X-Authorization": session.session.id,
                  },
                  method: "POST",
                  body: image,
                }
              );
              let data = (await res.json()) as
                | { success: false }
                | { success: true; data: { id: string } };
              if (!data.success) return;
              await mutate("assertFact", {
                entity: props.entityID,
                attribute: "card/image",
                value: { type: "file", id: data.data.id, filetype: "image" },
                positions: {},
              });
            }}
            section="card/content"
            placeholderOnHover={true}
            className={`cardPreviewDefaultTextContent truncate whitespace-pre-wrap pt-1 leading-tight  ${
              !image ? "" : "rounded-[3px] bg-white/75 px-1"
            } `}
          />
        </div>
      </div>
    </div>
  );
};
