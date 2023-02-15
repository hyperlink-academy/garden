import { Thought } from ".";

export const Discussion = (props: { setCardState: () => void }) => {
  return (
    <div className="">
      <button onClick={() => props.setCardState()}>back </button>
      <Thought />
      <div>
        <div className="flex justify-between gap-2 text-grey-55">
          <small className="font-bold">jared</small>
          <small>3/3/23</small>
        </div>
        <div className="text-grey-35">
          here is a response to your thought :D
        </div>
        <small className=" place-self-end text-grey-80 underline group-hover:text-accent-blue">
          2 replies
        </small>
      </div>
    </div>
  );
};
