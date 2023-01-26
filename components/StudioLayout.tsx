import { spaceAPI } from "backend/lib/api";
import { useAuth } from "hooks/useAuth";
import { ReplicacheContext, useIndex, useMutations } from "hooks/useReplicache";
import Head from "next/head";
import { useState, useContext } from "react";
import { ButtonPrimary, ButtonSecondary, ButtonTertiary } from "./Buttons";
import { Door, DoorSelector } from "./DoorSelector";
import { SpaceCreate } from "./Icons";
import { Modal } from "./Layout";

export const StudioName = () => {
  let name = useIndex.aev("this/name", "")[0];
  if (!name) return null;
  return (
    <>
      <Head>
        <title key="title">{name?.value}'s studio</title>
        <meta name="theme-color" content="#fffaf0" />
      </Head>
      <div>
        <h1>{name?.value}'s studio</h1>
      </div>
    </>
  );
};
