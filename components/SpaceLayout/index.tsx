import { SmallCardDragContext } from "../DragContext";
import { useIndex } from "hooks/useReplicache";
import Head from "next/head";

import { SpaceHeader } from "./SpaceHeader";

export const SpaceLayout: React.FC = (props) => {
  let spaceName = useIndex.aev("this/name")[0];

  return (
    <>
      <Head>
        <title key="title">{spaceName?.value}</title>
      </Head>
      <div className="pageWrapper flex flex-col sm:gap-4 gap-2 h-screen items-stretch justify-items-center overflow-hidden">
        <SpaceHeader />

        <div
          className={`
          pageContent 
          h-[calc(100vh-80px)] w-full max-w-6xl 
          sm:px-4 px-2 mx-auto
          grow 
          relative 
          flex items-stretch `}
        >
          <SmallCardDragContext>{props.children}</SmallCardDragContext>
        </div>
      </div>
    </>
  );
};
