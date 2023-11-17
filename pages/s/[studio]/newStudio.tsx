import { ButtonPrimary } from "components/Buttons";
import { CreateSpace } from "components/CreateSpace";
import { Divider } from "components/Layout";

export const NewStudio = (props: {
  studioSpaceID: string;
  studioName: string;
}) => {
  return (
    <div className="flex flex-col gap-6 pt-4 text-grey-35">
      <div className=" lightBorder flex flex-col-reverse items-center gap-4 bg-white p-4 text-center sm:flex-row ">
        <div className="flex grow  flex-col place-items-center gap-3">
          <h1>Welcome to Hyperlink!</h1>
          <p className="text-lg">
            <span className="font-bold">Here, you make and join Spaces.</span>
            <br />
            Which are like collaborative notebooks with group chats. <br />
            One for each of your projects.
          </p>
          <div className="flex flex-col gap-1 pt-4">
            <ButtonPrimary content="Explore the a Test Space!" />
            <p className="text-sm text-grey-55">
              Look around, tinker, test, <br />
              and get the hang of it
            </p>
          </div>
        </div>
        <div className="flex shrink-0  flex-col items-center gap-2 ">
          <img
            className="rounded-md"
            width={"280px"}
            alt="an overgrown door with a ladder leading up to it"
            src="/img/spotIllustration/sandbox.png"
          />
        </div>
      </div>
      <div className="flex flex-col place-items-center gap-4  text-center">
        <div className="flex flex-col gap-1">
          <p className="font-bold">Already know what you&apos;re doing?</p>
          <p>Start with an empty Space!</p>
        </div>
        <div className="flex flex-col gap-1">
          <CreateSpace
            studioSpaceID={props.studioSpaceID}
            studioName={props.studioName}
          />
          <p className="text-sm text-grey-55">
            We'll keep the test space around, <br /> in case you need it again
          </p>
        </div>
      </div>
    </div>
  );
};
