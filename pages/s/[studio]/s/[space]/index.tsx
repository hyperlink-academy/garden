import { CardView } from "components/CardView";
import { DeckList } from "components/DeckList";
import { Desktop } from "components/Desktop";
import { CollapseTiny, DownArrow, ExpandTiny, UpArrow } from "components/Icons";
import { SpaceInfo } from "components/SpaceInfo";

export default function SpacePage() {
  return (
    <div className="h-full flex flex-col items-stretch relative -mx-4 -mt-4">
      <div className="mx-auto max-w-3xl h-full w-full overflow-x-scroll flex flex-row gap-2 snap-x snap-mandatory">
        <div className="overflow-y-scroll no-scrollbar flex-shrink-0 w-[320px] snap-center">
          <div className="px-4">
            <SpaceInfo />
          </div>
          <Desktop />
        </div>
        <CardViewPanel />
      </div>
    </div>
  );

  // return (
  //   <div className="h-full flex flex-col items-stretch relative">
  //     <div className="mx-auto max-w-3xl h-full flex flex-row gap-6">
  //       <div className="overflow-y-scroll no-scrollbar flex-shrink-0 w-[320px]">
  //         <SpaceInfo />
  //         <Desktop />
  //       </div>
  //       <CardViewPanel />
  //     </div>
  //   </div>
  // );
}
export const CardViewPanel = () => {
  return (
    <div className="flex flex-col gap-1 pb-2 pt-4 px-2 min-w-[100vw]">
      <div className="grid grid-cols-[auto_max-content] w-full text-grey-55">
        <small>back to [origin card]</small>
        <small className="items-center justify-self-end flex gap-1">
          <ExpandTiny />
          <CollapseTiny />
        </small>
      </div>
      <div className="h-full flex flex-grow snap-center">
        <CardView entityID="01G7ZAHGGNG3W0ZXZ0HEMRMX48" />

        {/* card lots of backlinks: 01G7Z5MRD3C54G6RBB0A9D1EFR */}
        {/* deck lots of content: 01G7ZAHGGNG3W0ZXZ0HEMRMX48 */}
        {/* card no content no backlinks: 01G7Z73P48JG31KMM3ZY9JT8AV */}

        {/* <div className="spaceHelp italic my-auto h-fit flex flex-col gap-4 text-grey-55">
          <div className="flex flex-col gap-1">
            <p className="font-bold"> 👈 card canvas tips and tricks!</p>
            <ul className="list-disc list-inside">
              <li> double-tap/click anywhere to add a new card</li>
              <li> rotate by moving a card with two fingers</li>
              <li> make a card big or small by pinching it</li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-bold"> 🛋️ about spaces</p>
            <p>
              {" "}
              this is a place for working on the things that make you happy!
            </p>
            <p>~</p>
            <p>
              it's particularly good at working with other people so invite your
              friends! Or you could do some cool things with others
              <span className="text-accent-blue"> here.</span>
            </p>
            <p>~</p>

            <p>
              if something's wrong/could be better, let us know at{" "}
              <span className="text-accent-blue">
                contact@hyperlink.academy
              </span>
              !
            </p>
          </div>
        </div> */}
      </div>
    </div>
  );
};
