import { Dialog } from "@headlessui/react";
import { useIndex, useMutations } from "hooks/useReplicache";
import { useState } from "react";
import { ulid } from "src/ulid";
import { ButtonPrimary } from "./Buttons";
import { Messages } from "./CardView/Discussion";
import { Message } from "data/Messages";
import { CloseLinedTiny, Send } from "./Icons";
import { Post } from "./StudioPosts";
import { Textarea } from "./Textarea";

export function StudioPostFullScreen(props: {
  entityID: string;
  studioID: string;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={true}
      onClose={props.onClose}
      className="fixed inset-0 z-30 overflow-y-hidden"
    >
      <Dialog.Overlay className={"dark-overlay"} />
      <div
        className={`
        fixed
              top-1/2 left-1/2 flex max-h-[calc(100%-32px)] w-[calc(100%-32px)]
              max-w-md -translate-x-1/2 -translate-y-1/2
              grid-flow-row
              flex-col
              gap-6 
              `}
      >
        <Post entityID={props.entityID} studioID={props.studioID} />
        <Comments entityID={props.entityID} />
      </div>
    </Dialog>
  );
}

function Comments(props: { entityID: string }) {
  let [newComment, setNewComment] = useState("");

  let { mutate, memberEntity, authorized } = useMutations();
  let [reply, setReply] = useState<string | null>(null);

  let replyMessage = useIndex.messageByID(reply);
  let replyToName = useIndex.eav(replyMessage?.sender || null, "member/name");

  const send = async () => {
    if (!memberEntity || !newComment) return;
    let message: Message = {
      id: ulid(),
      topic: props.entityID,
      ts: Date.now().toString(),
      sender: memberEntity,
      content: newComment,
    };
    await mutate("replyToDiscussion", {
      discussion: props.entityID,
      message,
    });
    setNewComment("");
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border border-grey-80 bg-white p-3">
      <Messages entityID={props.entityID} isRoom={false} setReply={setReply} />

      {reply && (
        <div className="messageInputReply -mb-2">
          <div className="flex items-start justify-between gap-2 rounded-md border border-grey-80 bg-white p-2 text-xs italic text-grey-55">
            <div className="flex flex-col gap-[1px]">
              <div className="font-bold"> {replyToName?.value}</div>
              <div>{replyMessage?.content}</div>
            </div>
            <button className="" onClick={() => setReply(null)}>
              <CloseLinedTiny />
            </button>
          </div>
          <div className="ml-2 h-2 w-0 border border-grey-80 " />
        </div>
      )}
      {authorized && (
        <div className="flex flex-col gap-2">
          <Textarea
            onKeyDown={(e) => {
              if (!e.shiftKey && e.key === "Enter") {
                e.preventDefault();
                send();
              }
            }}
            value={newComment}
            className="rounded-md border-2 border-grey-55 p-2"
            placeholder="Add a comment..."
            onChange={(e) => setNewComment(e.currentTarget.value)}
          />
          <div className="flex justify-end">
            <ButtonPrimary content={<Send />} onClick={() => send()} />
          </div>
        </div>
      )}
    </div>
  );
}
