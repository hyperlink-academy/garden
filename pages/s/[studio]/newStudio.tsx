import { ButtonPrimary } from "components/Buttons";
import { CreateSpace } from "components/CreateSpace";
import { Divider } from "components/Layout";

export const NewStudio = (props: {
  studioSpaceID: string;
  studioName: string;
}) => {
  return (
    <div className="flex flex-col gap-4 text-grey-35">
      <div className=" flex flex-col items-center gap-4 py-3 text-center">
        <div className="flex w-[full] flex-col gap-3">
          <h1>Welcome to Hyperlink!</h1>
          <p className="text-lg">
            <span className="font-bold">Here, you make and join Spaces.</span>
            <br />
            Which are like collaborative notebooks with group chats. <br />
            One for each of your projects.
          </p>
        </div>
        <div className="lightBorder flex w-full flex-col items-center gap-2 bg-white py-6">
          <div className="h-[350px] w-[260px] bg-test-pink" />

          <ButtonPrimary content="Explore the Playground!" />
          <p className="text-sm text-grey-55">
            Look around, tinker, test, <br />
            and get the hang of it
          </p>
        </div>
        <Divider />
        <div className="flex flex-col gap-4">
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
              (we'll keep the Playground around, <br /> in case you need it
              again)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
