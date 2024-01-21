"use client";
import { SpaceProvider } from "components/ReplicacheProvider";
import { SpaceData, SpaceList } from "components/SpacesList";
import { CreateSpace } from "components/CreateSpace";
import { CreateStudio } from "components/CreateStudio";
import { useAuth } from "hooks/useAuth";
import { useIdentityData } from "hooks/useIdentityData";
import { useEffect, useState } from "react";
import { DisclosureCollapseTiny, DisclosureExpandTiny } from "components/Icons";
import Head from "next/head";
import { NotificationManager } from "components/NotificationManager";
import { Divider } from "components/Layout";
import { HelpExampleSpaces } from "components/HelpCenter";
import { uuidToBase62 } from "src/uuidHelpers";
import Link from "next/link";
import { IdentityData } from "backend/routes/get_identity_data";
import { useParams } from "next/dist/client/components/navigation";
import { LoginButton } from "app/studio/[studio_id]/space/SpaceViewerHeader";
import { useIsMobile } from "hooks/utils";

export default function UserHomePage(props: { data: IdentityData }) {
  let { session } = useAuth();
  let query = useParams<{ studio: string }>();
  let { data } = useIdentityData(query?.studio as string, props.data);
  let [sortOrder, _setSortOrder] = useState<"lastUpdated" | "name">(
    "lastUpdated"
  );

  const setSortOrder = (sortOrder: "lastUpdated" | "name") => {
    _setSortOrder(sortOrder);
    localStorage.setItem(`${query?.studio}/sortOrder`, sortOrder);
  };
  useEffect(() => {
    let savedSortOrder = localStorage.getItem(`${query?.studio}/sortOrder`);
    if (savedSortOrder) _setSortOrder(savedSortOrder as "lastUpdated" | "name");
  }, [query?.studio, _setSortOrder]);
  if (!data) return <div>loading </div>;

  let currentStudioName = query?.studio;
  let studios = data?.members_in_studios.map(
    (s) => s.studios as Exclude<typeof s.studios, null>
  );
  let spaces = [
    ...data.members_in_spaces
      ?.filter((s) => !!s.space_data)
      .map((s) => s.space_data as SpaceData)
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
      }),
  ];

  return (
    <>
      <Head>
        <title key="title">{currentStudioName}</title>
      </Head>
      <SpaceProvider id={data.studio}>
        <div className="mb-0 flex flex-col gap-2">
          <div className="flex w-full flex-row items-center justify-between gap-2">
            <h2 className="grow">{currentStudioName}</h2>

            {session?.loggedIn ? (
              session.session?.username === currentStudioName && (
                <NotificationManager />
              )
            ) : (
              <LoginButton />
            )}
          </div>
          <div className="flex flex-row items-center justify-between">
            <h4>Studios</h4>
            {session.session &&
              session.session?.username === currentStudioName && (
                <CreateStudio username={session.session.username} />
              )}
          </div>
          {studios.length > 0 ? (
            <>
              <div className="grid  w-full grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                {studios.map((studio) => (
                  <Link
                    prefetch
                    href={`/studio/${uuidToBase62(studio.id)}`}
                    className="grid h-[120px] w-full flex-col place-items-center rounded-md border border-accent-blue bg-bg-blue text-center hover:border-2"
                    key={studio.id}
                  >
                    <div className="flex h-fit flex-col">
                      <h4 className="text-accent-blue">{studio.name}</h4>
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
            </>
          ) : (
            spaces.length > 0 && (
              <div className="text-sm text-grey-55 ">
                Studios are places to collect related spaces. <br />
                Invite friends and work alongside each other as a creative
                collective!
              </div>
            )
          )}
          <div className="pb-2 pt-4">
            <Divider />
          </div>

          {spaces.length === 0 ? null : (
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
                </div>{" "}
                {session.session?.username === currentStudioName &&
                  spaces.length !== 0 && (
                    <CreateSpace
                      studioSpaceID={data.studio}
                      studioName={currentStudioName as string}
                    />
                  )}
              </div>
            </>
          )}
          <List
            spaces={spaces}
            id={data.studio}
            name={query?.studio as string}
          />
        </div>
      </SpaceProvider>
    </>
  );
}

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

/*
three lists:
- active (scheduled - now) 
- upcoming (scheduled - soon)
- unscheduled (i.e. implicit draft)

NB: calendar.tsx uses same date calculations
but simplified b/c calendar requires start + end dates
*/
const List = (props: {
  spaces: Array<SpaceData>;
  id: string;
  name: string;
}) => {
  let { session } = useAuth();

  let myStudioName = session.session?.username;

  let spaces = props.spaces.filter((s) => !s.archived);

  let { mutate } = useIdentityData(props.name);

  return (
    <div className="flex flex-col gap-8">
      {spaces.length > 0 ? (
        <SpaceList
          spaces={spaces}
          onEdit={() => {
            mutate();
          }}
        />
      ) : null}

      {/* empty state - if user homepage has NO ACTIVE SPACES */}
      {/* different messages for logged in user vs. viewing someone else's home */}
      {spaces.length == 0 ? (
        session?.loggedIn && myStudioName == props.name ? (
          // <NewStudio
          //   studioSpaceID={props.id}
          //   studioName={myStudioName as string}
          // />
          <MyHomeEmpty
            studioSpaceID={props.id}
            studioName={myStudioName as string}
          /> /* me as in the logged in user who can make spaces here */
        ) : (
          <YourHomeEmpty
            username={props.name}
          /> /* you as in I'm viewing a homepage that's not mine-the-authed-user's */
        )
      ) : null}

      <HistoryList spaces={props.spaces} />
    </div>
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
  return (
    <div className="lightBorder flex flex-col bg-white sm:flex-row">
      {isMobile ? (
        <img
          src="/img/spotIllustration/sandboxMobile.png"
          alt="a door overgrown with moss"
        />
      ) : (
        <img
          src="/img/spotIllustration/sandbox.png"
          alt="a door overgrown with moss"
          width={300}
          height={600}
        />
      )}

      <div className=" flex h-full flex-col gap-3 p-4 text-grey-35 sm:p-8 sm:py-4 ">
        <h3 className="text-grey-15">Welcome to Hyperlink!</h3>

        <p>
          Hyperlink is all about making and sharing{" "}
          <em className="font-bold">spaces</em>.
        </p>
        <p>
          A Space is for keeping notes, progress logs, and plans for a specific
          project you&apos;re working on, especially a collaborative one!
        </p>
        <div className="flex flex-col gap-1">
          <p className="font-bold">For example</p>
          <ul className="list-inside list-disc ">
            <li>
              coordinate{" "}
              <Link
                className="text-accent-blue hover:underline"
                href="s/brendan/s/23/hyperlink-writing-room"
              >
                a writing group
              </Link>
            </li>
            <li>
              track and share{" "}
              <Link className="text-accent-blue hover:underline" href="">
                a creative craft
              </Link>
            </li>
            <li>
              organize{" "}
              <Link className="text-accent-blue hover:underline" href="">
                a side project
              </Link>
            </li>
            <li>
              collect{" "}
              <Link className="text-accent-blue hover:underline" href="">
                your favorite recipes
              </Link>
            </li>
          </ul>
          <p className="text-sm italic text-grey-55">
            * these are all real, actually used spaces! they might be a litte
            messy, but they&apos;re authentic!
          </p>
        </div>
        <div className="lightBorder mt-4 flex flex-col gap-2 bg-bg-blue p-4 text-center">
          <h4>Let&apos;s get started!</h4>
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
