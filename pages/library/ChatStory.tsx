import ChatPage from "pages/s/[studio]/s/[space]/chat";
import { ComponentViewer, Props, Stories } from "./index";
export { getStaticProps } from "./index";
const entities: Stories = {
  NoMessages: {
    entities: [{ "card/title": "A Card!" }],
  },
  ManyMessages: {
    entities: [{}],
  },
};

const ChatStory = (props: Props) => {
  return (
    <ComponentViewer components={props.components} stories={entities}>
      <div className="h-[600px]">
        <ChatPage />
      </div>
    </ComponentViewer>
  );
};

ChatStory.metadata = {
  name: "Chat",
};

export default ChatStory;
