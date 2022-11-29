import { useAuth } from "hooks/useAuth";
import Link from "next/link";
import useSWR from "swr";
import { useRouter } from "next/router";
import { ExitDoor, Member } from "./Icons";
import { SmallCardDragContext } from "./DragContext";
import { useIndex } from "hooks/useReplicache";
import Head from "next/head";
import { useSmoker } from "./Smoke";
import { spaceAPI } from "backend/lib/api";
import { Divider, Modal } from "./Layout";
import { useNextHighlight } from "hooks/useNextHighlight";
import { useState } from "react";
import { ButtonSecondary } from "./Buttons";
import { LogInModal } from "./LoginModal";

import { Header } from "./AppHeader";

export const SpaceLayout: React.FC = (props) => {
  let spaceName = useIndex.aev("this/name")[0];

  return (
    <>
      <Head>
        <title key="title">{spaceName?.value}</title>
      </Head>
      <div className="pageWrapper flex flex-col sm:gap-4 gap-2 h-screen items-stretch justify-items-center overflow-hidden">
        {/* HEADER START */}
        <Header />
        {/* HEADER END */}

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
