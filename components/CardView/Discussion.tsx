import { ButtonPrimary } from "components/Buttons";
import { GoBackToPage, Send } from "components/Icons";
import { useState } from "react";
import { Thought } from ".";

export const Discussion = (props: {
  toggleCardState: () => void;
  cardState: string;
}) => {
  let [thoughtInputFocus, setThoughtInputFocus] = useState(false);
  return (
    <div className="flex flex-col gap-4 ">
      <div className="flex flex-col gap-2">
        <button onClick={() => props.toggleCardState()}>
          <div className="flex items-center gap-2 text-accent-blue">
            <GoBackToPage /> back
          </div>
        </button>
        <Thought cardState="discussion" />
      </div>
      <div className="flex flex-col gap-6 px-3">
        <Reply
          author="jared"
          date="3/3/23"
          content="here is a response to your thought, which i thought was very thoughtful"
        />
        <Reply
          author="brendan"
          date="3/3/23"
          content="oh that's actually a very interesting point. I am a great commenter so my comment is going to be longer. It'll be full of like amamzing insights, and otherworldly observations. Hopefully you find it helpful!"
        />
        <Reply author="celine" date="3/3/23" content="coolio doods" />
      </div>
      <div className="flex flex-col gap-2 px-2 pt-2">
        <textarea
          placeholder="add your response..."
          onFocus={() => setThoughtInputFocus(true)}
          onBlur={() => setThoughtInputFocus(false)}
          className={`${
            thoughtInputFocus ? "test-bg-pink h-32" : "h-10"
          } w-full border-grey-80`}
          id="thoughtInput"
        ></textarea>
        {!thoughtInputFocus ? null : (
          <div className="flex items-center justify-end text-grey-55">
            <ButtonPrimary icon={<Send />} />
          </div>
        )}
      </div>
    </div>
  );
};

const Reply = (props: { content: string; author: string; date: string }) => {
  return (
    <div>
      <div className="flex gap-2 text-grey-55">
        <small className="font-bold">{props.author}</small>
        <small>{props.date}</small>
      </div>
      <div className="text-grey-35">{props.content} </div>
    </div>
  );
};
