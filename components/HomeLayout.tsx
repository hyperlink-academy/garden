import { useAuth } from "hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { ButtonLink } from "./Buttons";
import * as Popover from "@radix-ui/react-popover";
import { CreateStudio } from "./CreateStudio";
import { useIdentityData } from "hooks/useIdentityData";
import { uuidToBase62 } from "src/uuidHelpers";
import Head from "next/head";
import { LoginOrSignupModal } from "./LoginModal";

export const HomeLayout = (props: {
  id: string;
  children: React.ReactNode;
}) => {
  return (
    <>
      <Head>
        <meta name="theme-color" content="#FFFFFF" />
      </Head>
      <div className="mx-auto mt-3 max-w-4xl px-3 pb-6 sm:px-4 sm:pb-8">
        {props.children}
      </div>
    </>
  );
};
