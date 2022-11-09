import { CardViewer, LinkContextProvider } from "components/CardViewer";
import { Desktop } from "components/Desktop";

export default function SpacePage() {
  return (
    <CardViewer>
      <Page />
    </CardViewer>
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
     h-full
      flex flex-col gap-0
      `}
    >
      <LinkContextProvider type="desktop">
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
