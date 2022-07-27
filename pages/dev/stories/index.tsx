import { InferGetStaticPropsType } from "next";
import Link from "next/link";
import path from "path";
import fs from "fs/promises";
import {
  Entity,
  LocalReplicacheProvider,
} from "components/LocalReplicacheProvider";
import { useSubscribe } from "replicache-react";
import { useContext, useState } from "react";
import { ReplicacheContext } from "hooks/useReplicache";
import { Attribute } from "data/Attributes";
import { Fact, Schema } from "data/Facts";
import { useRouter } from "next/router";
import { Menu, Switch } from "@headlessui/react";
import { AuthContext } from "hooks/useAuth";
import { MenuIcon } from "components/Icons";
import { MenuContainer, MenuItem } from "components/Layout";
import Head from "next/head";
import { SmallCardDragContext } from "components/DragContext";

export type Props = InferGetStaticPropsType<typeof getStaticProps>;

type Metadata = {
  name: string;
};

export type Stories = {
  [k: string]: {
    attributes?: { [k: string]: Schema };
    entities: Entity[];
  };
};

type AuthState = "loggedOut" | "loggedIn" | "authorized";

const AuthStates = {
  loggedOut: { loggedIn: false },
  loggedIn: {
    loggedIn: true,
    token: "a token",
    session: {
      studio: "loggedin-studio",
      id: "session-id",
      createdAt: "0",
      userAgent: "unknown",
      username: "Newton",
      user: "" as any,
    },
  },
  authorized: {
    loggedIn: true,
    token: "a token",
    session: {
      studio: "authorized-studio",
      id: "session-id",
      createdAt: "0",
      userAgent: "unknown",
      username: "Newton",
      user: "" as any,
    },
  },
} as const;
export const ComponentViewer: React.FC<{
  components: Props["components"];
  stories: Stories;
}> = (props) => {
  let keys = Object.keys(props.stories);
  let [story, setStory] = useState(keys[0]);
  let [bg, setBg] = useState(true);
  let [authState, setAuthState] = useState<AuthState>("loggedOut");

  return (
    <AuthContext.Provider
      value={{
        rep: null,
        session: AuthStates[authState],
        logout: async () => false,
        login: async () => {
          return { success: false, error: "noUser" } as const;
        },
      }}
    >
      <LocalReplicacheProvider
        defaultAttributes={story ? props.stories[story].attributes || {} : {}}
        defaultFacts={story ? props.stories[story].entities : []}
      >
        <Head>
          <title key="title">Hyperlink Component Library</title>
        </Head>
        <SmallCardDragContext>
          <div
            className="max-w-3xl m-auto p-6"
            style={{ maxWidth: "48rem", margin: "auto" }}
          >
            <div className="flex gap-4 justify-between p-6 pb-4 text-accent-blue px-5">
              <PageSidebar pages={props.components} />
              <div className="flex gap-2">
                <BGSwitch enabled={bg} setEnabled={setBg} />
                <AuthStatePicker
                  authState={authState}
                  setAuthState={setAuthState}
                />
              </div>
            </div>
            <div className="flex flex-col gap-6 w-full">
              <div
                className={`
              ComponentViewPort
              flex flex-col gap-6
              w-full
              ${
                bg
                  ? "bg-white border border-grey-80 rounded-lg shadow-drop p-5"
                  : "bg-background"
              } 
            `}
              >
                <StoryPicker
                  story={story}
                  stories={Object.keys(props.stories)}
                  setStory={setStory}
                />
                {props.children}
              </div>
              <AllFacts />
            </div>
          </div>
          {/* WRAPPER - CLOSE */}
        </SmallCardDragContext>
      </LocalReplicacheProvider>
    </AuthContext.Provider>
  );
};

const AllFacts = () => {
  let rep = useContext(ReplicacheContext);
  let facts = useSubscribe(
    rep?.rep,
    async (tx) => {
      return (await tx.scan({ prefix: "" }).values().toArray()) as Fact<
        keyof Attribute
      >[];
    },
    [],
    []
  );

  if (facts.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl">All Facts</h2>
      <ul className="grid gap-2 text-grey-35">
        {facts.map((f) => {
          return (
            <ul
              key={f.id}
              className="pt-3 pb-5 border-b border-grey-55 border-dashed last:border-none"
            >
              <li>
                <span className="font-bold">entity: </span>
                {f.entity}
              </li>
              <li>
                <span className="font-bold">attribute: </span> {f.attribute}
              </li>
              <li>
                <span className="font-bold">value: </span>{" "}
                {JSON.stringify(f.value)}
              </li>
              <li>
                <span className="font-bold">positions: </span>{" "}
                {JSON.stringify(f.positions)}
              </li>
            </ul>
          );
        })}
      </ul>
    </div>
  );
};

const AuthStatePicker = (props: {
  authState: AuthState;
  setAuthState: (s: AuthState) => void;
}) => {
  return (
    <Menu as="div" className="relative">
      <Menu.Button className="font-bold">auth: {props.authState}</Menu.Button>
      <MenuContainer>
        <Menu.Item>
          {({ active }) => (
            <button
              className={`px-3 py-4 flex items-center gap-2 justify-end ${
                active ? "bg-bg-blue" : ""
              } ${props.authState === "loggedOut" ? "font-bold" : ""}`}
              onClick={() => props.setAuthState("loggedOut")}
            >
              Logged Out
            </button>
          )}
        </Menu.Item>
        <Menu.Item>
          {({ active }) => (
            <button
              className={`px-3 py-4 flex items-center gap-2 justify-end ${
                active ? "bg-bg-blue" : ""
              } ${props.authState === "loggedIn" ? "font-bold" : ""}`}
              onClick={() => props.setAuthState("loggedIn")}
            >
              Logged In
            </button>
          )}
        </Menu.Item>
        <Menu.Item>
          {({ active }) => (
            <button
              className={`px-3 py-4 flex items-center gap-2 justify-end ${
                active ? "bg-bg-blue" : ""
              } ${props.authState === "authorized" ? "font-bold" : ""}`}
              onClick={() => props.setAuthState("authorized")}
            >
              Authorized
            </button>
          )}
        </Menu.Item>
      </MenuContainer>
    </Menu>
  );
};

const BGSwitch = (props: {
  enabled: boolean;
  setEnabled: (b: boolean) => void;
}) => {
  return (
    <div className="flex gap-2">
      <span className="font-bold">BG</span>

      <Switch
        checked={props.enabled}
        onChange={props.setEnabled}
        className={`${
          props.enabled ? "bg-background" : "bg-white "
        } border-2 border-accent-blue relative inline-flex items-center h-6 rounded-full w-11`}
      >
        <span className="sr-only">Toggle background</span>
        <span
          className={`${
            props.enabled ? "translate-x-5" : "translate-x-1"
          } inline-block w-4 h-4 transform bg-accent-blue rounded-full`}
        />
      </Switch>
    </div>
  );
};

const PageSidebar = (props: { pages: Props["components"] }) => {
  let router = useRouter();
  let [isOpen, toggleOpen] = useState(false);
  return (
    <>
      <button onClick={() => toggleOpen(!isOpen)}>
        <MenuIcon />
      </button>
      <div>
        {!isOpen ? null : (
          <div className="ComponentMenu z-50 w-64 fixed left-0 top-0 h-screen p-4 bg-bg-blue grid auto-rows-max gap-4">
            <div className="grid grid-cols-[max-content_max-content] place-content-between px-2">
              <h3>Component Library</h3>
              <button onClick={() => toggleOpen(!isOpen)}>x</button>
            </div>
            <ul>
              {props.pages.map((c) => {
                return (
                  <li key={c.path}>
                    <div
                      className={`px-2 py-0.5 font-bold  
                  ${
                    c.path === router.pathname
                      ? "text-white rounded-md bg-accent-blue"
                      : "text-grey-55  hover:text-accent-blue "
                  }`}
                    >
                      <Link href={c.path}>
                        <a>{c.metadata.name}</a>
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </>
  );
};

const StoryPicker = (props: {
  story: string;
  stories: string[];
  setStory: (s: string) => void;
}) => {
  return (
    <div className="grid auto-rows-max gap-1 p-4 border border-grey-80 rounded-md">
      {props.stories.map((story) => {
        return (
          <div className="flex flex-row gap-2 items-center" key={story}>
            <input
              checked={props.story === story}
              type="radio"
              name="story-select"
              id={`${story}`}
              onChange={() => props.setStory(story)}
            ></input>

            <label
              htmlFor={`${story}`}
              className={`text-grey-35  ${
                props.story === story ? "font-bold" : ""
              }`}
            >
              {story}
            </label>
          </div>
        );
      })}
    </div>
  );
};

const IndexPage = (props: Props) => {
  return (
    <ComponentViewer stories={{}} components={props.components}>
      <div>hello</div>
    </ComponentViewer>
  );
};

IndexPage.metadata = { name: "Home" };

export default IndexPage;

export async function getStaticProps() {
  let componentLibraryPath = path.join(process.cwd(), "/pages/dev/stories/");
  let componentFiles = await fs.readdir(componentLibraryPath);
  let components = await Promise.all(
    componentFiles
      .filter((c) => c !== "index.tsx")
      .map(async (c) => {
        let component = await import("./" + c);
        return {
          path: `/dev/stories/${c.split(".")[0]}`,
          metadata: component.default.metadata as Metadata,
        };
      })
  );
  return { props: { components } };
}
