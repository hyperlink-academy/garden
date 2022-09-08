import {
  PopupCardViewer,
  LinkContextProvider,
} from "components/PopupCardViewer";
import { CardView } from "components/CardView";
import { Desktop } from "components/Desktop";
import { SpaceInfo } from "components/SpaceInfo";
import { useState } from "react";
import useMeasure from "react-use-measure";

export default function SpacePage() {
  return (
    <PopupCardViewer>
      <Page />
    </PopupCardViewer>
  );
}

function Page() {
  let [stack, setStack] = useState<string[]>([
    "01G2GQSY6YRRQ5WPJT1JR08R8M",
    "01G1WGT87V3VRMHWMNESXV7XGX",
    "01G5XAKYRBXC7Y292P4KHSEDG3",
  ]);

  let [cardWidthRef, data] = useMeasure();
  let spacerWidth = window.innerWidth / 2 - (data.width + 16) / 2;

  return (
    <div className="h-full flex flex-col items-stretch relative py-8">
      <div className="mx-auto h-full w-full flex flex-row gap-2 snap-x snap-mandatory overflow-x-scroll">
        <div className="scrollSpacer h-full">
          <div style={{ width: spacerWidth }} />
        </div>
        <div className="overflow-y-scroll no-scrollbar flex-shrink-0 w-[350px] snap-center">
          <LinkContextProvider type="desktop">
            <div className="px-4">
              <SpaceInfo />
            </div>
            <Desktop />
          </LinkContextProvider>
        </div>
        {stack.map((s) => {
          return (
            <LinkContextProvider type="entity" entityID={s}>
              <div
                className={`h-full w-[calc(100%-32px)] max-w-xl snap-center flex-shrink-0 pb-1.5 focus:outline-none `}
                ref={cardWidthRef}
              >
                <CardView entityID={s} />
              </div>
            </LinkContextProvider>
          );
        })}
        <div className="scrollSpacer h-full">
          <div style={{ width: spacerWidth }} />
        </div>
      </div>
    </div>
  );
}

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
