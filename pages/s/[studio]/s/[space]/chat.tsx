import { useState } from "react";
import { useIndex, useMutations } from "hooks/useReplicache";
import { ulid } from "src/ulid";
import { useAuth } from "hooks/useAuth";
import Textarea from "components/AutosizeTextArea";

export default function ChatPage() {
  return (
    <div className="h-full flex flex-col relative items-stretch">
      <Messages />
      <MessageInput />
    </div>
  );
}

const Messages = () => {
  let messages = useIndex.messages();
  return (
    <div className="h-full overflow-auto flex flex-col-reverse">
      <div>
        {messages.map((m) => {
          return (
            <div className="flex flex-col gap-2">
              <div className="font-bold">{m.sender}</div>
              <pre className="whitespace-pre-wrap">{m.content}</pre>
            </div>
          );
        })}
      </div>
    </div>
  );
};
const MessageInput = () => {
  let [message, setMessage] = useState("");
  let { session } = useAuth();
  let { authorized, mutate } = useMutations();

  return (
    <div className="-mx-4 border-t">
      <Textarea
        className="bg-background p-1"
        placeholder="write a message"
        value={message}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (e.shiftKey) {
              return;
            }
            if (!authorized || !session.session || !message) return;
            mutate("postMessage", {
              id: ulid(),
              content: message,
              sender: session.session.username,
              ts: Date.now().toString(),
            });
            setMessage("");
          }
        }}
        onChange={(e) => setMessage(e.currentTarget.value)}
      />
    </div>
  );
};
