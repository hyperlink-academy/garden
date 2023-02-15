import { GoBackToPage } from "components/Icons";
import { Thought } from ".";

export const Discussion = (props: { setCardState: () => void }) => {
  return (
    <div className="s">
      <button onClick={() => props.setCardState()}>
        <div className="flex gap-2 text-accent-blue">
          <GoBackToPage /> back
        </div>
      </button>
      <Thought />
      <Reply />
      <Reply />
      <Reply />
    </div>
  );
};

const Reply = () => {
  return (
    <div>
      <div className="flex justify-between gap-2 text-grey-55">
        <small className="font-bold">jared</small>
        <small>3/3/23</small>
      </div>
      <div className="text-grey-35">here is a response to your thought :D</div>
      <small className=" place-self-end text-grey-80 underline group-hover:text-accent-blue">
        2 replies
      </small>
    </div>
  );
};
