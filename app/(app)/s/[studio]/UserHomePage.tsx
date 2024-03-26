"use client";
import { SpaceData, SpaceList } from "components/SpacesList";
import { CreateSpace } from "components/CreateSpace";
import { CreateStudio } from "components/CreateStudio";
import { useAuth } from "hooks/useAuth";
import { useIdentityData } from "hooks/useIdentityData";
import { useEffect, useState } from "react";
import { DisclosureCollapseTiny, DisclosureExpandTiny } from "components/Icons";
import { Divider } from "components/Layout";
import { uuidToBase62 } from "src/uuidHelpers";
import Link from "next/link";
import { IdentityData } from "backend/routes/get_identity_data";
import { useParams } from "next/navigation";
import { useIsMobile } from "hooks/utils";
import Image from "next/image";
import sandboxSpot from "public/img/spotIllustration/sandbox.png";
import mobileSandboxSpot from "public/img/spotIllustration/sandboxMobile.png";
import { useHomeTabs } from "app/(app)/@sidebar/s/[studio]/HomeTabs";
import { UserSettings } from "./UserSettings";

type Studio = NonNullable<
  NonNullable<
    ReturnType<typeof useIdentityData>["data"]
  >["members_in_studios"][0]["studios"]
>;
export default function UserHomePage(props: { data: IdentityData }) {
  let [tab] = useHomeTabs(props.data.username);
  let query = useParams<{ studio: string }>();
  let { data } = useIdentityData(query?.studio as string, props.data);

  if (!data) return <div>loading </div>;

  let currentStudioName = query?.studio as string;
  let studios = data?.members_in_studios.map(
    (s) => s.studios as Exclude<typeof s.studios, null>
  );
  let spaces = [
    ...data.members_in_spaces
      ?.filter((s) => !!s.space_data)
      .map((s) => s.space_data as SpaceData),
  ];

  return (
    <>
      <div className="my-3 flex h-fit min-w-[min(calc(100vw-128px),56rem)] max-w-4xl flex-col gap-2 sm:my-0">
        {tab === "Home" ? (
          <Homepage
            spaces={spaces}
            studios={studios}
            username={currentStudioName}
            studio_do_id={data.id}
          />
        ) : (
          <UserSettings />
        )}
      </div>
    </>
  );
}

let Homepage = ({
  spaces,
  studios,
  username,
  studio_do_id,
}: {
  spaces: SpaceData[];
  studios: Studio[];
  username: string;
  studio_do_id: string;
}) => {
  let { session } = useAuth();
  let myStudioName = session.session?.username;
  if (spaces.length === 0) {
    if (session?.loggedIn && session.session && myStudioName == username)
      return (
        <>
          {studios.length > 0 ? (
            <Studios studios={studios} currentStudioName={username} />
          ) : null}
          <MyHomeEmpty
            studioSpaceID={session.session?.studio}
            studioName={myStudioName as string}
          />
          {/* me as in the logged in user who can make spaces here  */}
        </>
      );
    return <YourHomeEmpty username={username} />;
  }

  return (
    <>
      {session?.loggedIn && myStudioName == username && (
        <Studios studios={studios} currentStudioName={username} />
      )}
      <Spaces spaces={spaces} name={username as string} id={studio_do_id} />
    </>
  );
};

const Studios = ({
  studios,
  currentStudioName,
}: {
  studios: {
    id: string;
    name: string;
    spaces_in_studios: {}[];
    members_in_studios: {}[];
  }[];
  currentStudioName?: string;
}) => {
  let { session } = useAuth();
  if (studios.length === 0)
    return (
      <>
        <div className="flex flex-row items-center justify-between">
          <h4>Studios</h4>
          {session.session &&
            session.session?.username === currentStudioName && (
              <CreateStudio username={session.session.username} />
            )}
        </div>
        <div className="max-w-lg text-sm italic text-grey-55">
          Studios are places for groups to work together and share related
          Spaces — like a collection of projects or gatherings.
        </div>
        <div className="pb-2 pt-4">
          <Divider />
        </div>
      </>
    );

  return (
    <>
      <div className="flex flex-row items-center justify-between">
        <h4>Studios</h4>
        {session.session && session.session?.username === currentStudioName && (
          <CreateStudio username={session.session.username} />
        )}
      </div>
      <div className="grid  w-full grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
        {studios.map((studio) => (
          <Link
            prefetch
            href={`/studio/${uuidToBase62(studio.id)}`}
            className="grid h-[120px] w-full flex-col place-items-center rounded-md border border-accent-blue bg-bg-blue text-center hover:border-2"
            key={studio.id}
          >
            <div className="flex h-fit flex-col">
              <h4
                className="text-accent-blue"
                style={{ wordBreak: "break-word" }} //no tailwind equiv - need for long titles to wrap
              >
                {studio.name}
              </h4>
              <p className="text-sm italic text-grey-55">
                {studio.spaces_in_studios.length} spaces
              </p>
              <p className="text-sm italic text-grey-55">
                {studio.members_in_studios.length} members
              </p>
            </div>
          </Link>
        ))}
      </div>
      <div className="pb-2 pt-4">
        <Divider />
      </div>
    </>
  );
};

const Spaces = (props: {
  spaces: Array<SpaceData>;
  name: string;
  id: string;
}) => {
  let [sortOrder, _setSortOrder] = useState<"lastUpdated" | "name">(
    "lastUpdated"
  );
  const setSortOrder = (sortOrder: "lastUpdated" | "name") => {
    _setSortOrder(sortOrder);
    localStorage.setItem(`${props.name}/sortOrder`, sortOrder);
  };
  useEffect(() => {
    let savedSortOrder = localStorage.getItem(`${props.name}/sortOrder`);
    if (savedSortOrder) _setSortOrder(savedSortOrder as "lastUpdated" | "name");
  }, [props.name, _setSortOrder]);
  let spaces = props.spaces
    .filter((s) => !s.archived)
    .sort((a, b) => {
      if (sortOrder === "name") {
        if (!a.display_name || !b.display_name) {
          if (a.display_name) return -1;
          if (b.display_name) return 1;
          return 0;
        }
        return a.display_name.localeCompare(b.display_name);
      }
      if (!a.lastUpdated || !b.lastUpdated) {
        if (a.lastUpdated) return -1;
        if (b.lastUpdated) return 1;
        return 0;
      }
      return a.lastUpdated > b.lastUpdated ? -1 : 1;
    });
  let { session } = useAuth();
  let { mutate } = useIdentityData(props.name);

  return (
    <>
      <div className="flex justify-between gap-2">
        <h4 className="">Spaces</h4>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-row gap-2 text-sm">
          <button
            onClick={() => setSortOrder("lastUpdated")}
            className={`h-fit rounded-md border px-1 py-0.5 hover:border-grey-80 ${
              sortOrder === "lastUpdated"
                ? " border-grey-80 text-grey-35"
                : "border-transparent text-grey-55"
            }`}
          >
            last updated
          </button>
          <button
            onClick={() => setSortOrder("name")}
            className={`h-fit rounded-md border px-1 py-0.5 hover:border-grey-80 ${
              sortOrder === "name"
                ? " border-grey-80 text-grey-35"
                : "border-transparent text-grey-55"
            } `}
          >
            name
          </button>
        </div>
        {session.session?.username === props.name && spaces.length !== 0 && (
          <CreateSpace studioSpaceID={props.id} studioName={props.name} />
        )}
      </div>
      <div className="flex flex-col gap-8">
        {spaces.length > 0 ? (
          <SpaceList
            spaces={spaces}
            onEdit={() => {
              mutate();
            }}
          />
        ) : null}
        <HistoryList spaces={props.spaces} />
      </div>
    </>
  );
};

const HistoryList = (props: { spaces: Array<SpaceData> }) => {
  let spacesHistory = props.spaces.filter((s) => s.archived);
  let [showHistory, setShowHistory] = useState(false);
  let query = useParams<{ studio: string }>();
  let { mutate } = useIdentityData(query?.studio as string);
  return (
    <>
      {spacesHistory.length > 0 ? (
        <div className="myStudioCompleted">
          <button
            className={`flex items-center gap-2 hover:text-accent-blue ${
              showHistory ? "text-grey-15" : "text-grey-55"
            }`}
            onClick={() => {
              setShowHistory(!showHistory);
            }}
          >
            <h4>Archived ({spacesHistory.length})</h4>
            {!showHistory ? (
              <DisclosureCollapseTiny />
            ) : (
              <DisclosureExpandTiny />
            )}
          </button>
          <div className={`${showHistory ? "" : "hidden"}`}>
            <SpaceList
              spaces={spacesHistory}
              onEdit={() => {
                mutate();
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
};

const YourHomeEmpty = (props: { username: string }) => {
  return (
    <div className="lightBorder my-4 flex flex-col gap-4 border p-4">
      <p>This person has no active Spaces.</p>
      <p>Check back later, or invite {props.username} to collaborate!</p>
    </div>
  );
};
const MyHomeEmpty = (props: { studioSpaceID: string; studioName: string }) => {
  let isMobile = useIsMobile();
  let [client, setClient] = useState(false);
  useEffect(() => {
    setClient(true);
  }, []);
  if (!client) return null;
  return (
    <div className="lightBorder flex flex-col bg-white sm:flex-row">
      {isMobile ? (
        <Image
          src={mobileSandboxSpot}
          alt="a door overgrown with moss"
          priority
        />
      ) : (
        <div
          style={{ width: "300px", position: "relative" }}
          className="shrink-0"
        >
          <Image
            style={{ objectFit: "cover" }}
            src={sandboxSpot}
            priority
            fill
            alt="a door overgrown with moss"
          />
        </div>
      )}

      <div className=" flex h-full flex-col gap-3 p-4 text-grey-35 sm:p-8 sm:py-4 ">
        <h3 className="text-grey-15">Welcome to Hyperlink!</h3>

        <p>
          Hyperlink is a place to make <em className="font-bold">Spaces</em> —
          collaborative environments for creative projects and gatherings.
        </p>
        <p>
          You can use Spaces to share notes and chats, plans and progress logs,
          collections, to do lists, and more.
        </p>
        {/* <div className="flex flex-col gap-1"> */}
        <p className="font-bold">For example:</p>
        <ul className="list-inside list-disc ">
          <li>
            coordinate{" "}
            <Link
              className="text-accent-blue hover:underline"
              href="/s/brendan/s/23/hyperlink-writing-room"
            >
              a writing group
            </Link>
          </li>
          <li>
            track and share{" "}
            <Link
              className="text-accent-blue hover:underline"
              href="/s/celine/s/Stuffy%20Stuff/stuffy-stuff"
            >
              a creative craft
            </Link>
          </li>
          <li>
            organize{" "}
            <Link
              className="text-accent-blue hover:underline"
              href="/s/brendan/s/Website%20Jam%3A%20pattern.kitchen/patternkitchen"
            >
              a side project
            </Link>
          </li>
          <li>
            collect{" "}
            <Link
              className="text-accent-blue hover:underline"
              href="/s/celine/s/What%20Should%20I%20Eat%20For%20Dinner/what-should-i-eat-for-dinner"
            >
              your favorite recipes
            </Link>
          </li>
        </ul>
        {/* <p className="mx-auto max-w-sm rounded-md border border-dashed border-grey-55 p-2 text-sm italic text-grey-55">
          ^these are all real spaces; they may be a bit messy, but they&apos;re
          authentic!
        </p> */}
        {/* <p>
          Like any place that&apos;s both a cozy spot to hang and a focused zone
          to get things done…Spaces are even better with friends :)
        </p> */}
        {/* </div> */}
        <div className="lightBorder mt-4 flex flex-col gap-2 bg-bg-blue p-4 text-center">
          <h4>{"Let's get started!"}</h4>
          <div className="m-auto">
            <CreateSpace
              studioSpaceID={props.studioSpaceID}
              studioName={props.studioName}
            />
          </div>
        </div>

        {/* <hr className="m-auto my-4 w-16 border-dashed border-grey-80" />

      <HelpExampleSpaces /> */}
      </div>
    </div>
  );
};
