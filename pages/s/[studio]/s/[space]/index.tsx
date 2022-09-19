import {
  PopupCardViewer,
  LinkContextProvider,
} from "components/PopupCardViewer";
import { CardView } from "components/CardView";
import { Desktop } from "components/Desktop";
import { SpaceInfo } from "components/SpaceInfo";
import { useState } from "react";
import useMeasure from "react-use-measure";
import { useDroppable } from "@dnd-kit/core";

export default function SpacePage() {
  return (
    <PopupCardViewer>
      <Page />
    </PopupCardViewer>
  );
}

function Page() {
  return (
    <div
      className={`
      Desktop 
      overflow-y-scroll overflow-x-hidden 
      no-scrollbar 
      snap-center
      flex-shrink-0 
      w-[352px] h-[100vh] 
      flex flex-col gap-0
      `}
    >
      <LinkContextProvider type="desktop">
        <SpaceInfo />
        <Desktop />
      </LinkContextProvider>
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
