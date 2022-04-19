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
import { Switch } from "@headlessui/react";

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

export const ComponentViewer: React.FC<{
  components: Props["components"];
  stories: Stories;
}> = (props) => {
  let keys = Object.keys(props.stories);
  let [story, setStory] = useState(keys[0]);
  let router = useRouter();
  let [isOpen, toggleOpen] = useState(false);
  let [bg, setBg] = useState(true);
  return (
    <LocalReplicacheProvider
      defaultAttributes={story ? props.stories[story].attributes || {} : {}}
      defaultFacts={story ? props.stories[story].entities : []}
    >
      <div style={{ maxWidth: "48rem", margin: "auto" }}>
        {" "}
        {/* WRAPPER - OPEN */}
        {/* MENU AND BG TOGGLE */}
        <div className="flex gap-4 justify-between pt-6 pb-4 text-accent-blue">
          <button onClick={() => toggleOpen(!isOpen)}>
            <MenuIcon />
          </button>
          <BGSwitch enabled={bg} setEnabled={setBg} />
        </div>
        {/* START COMPONENT MENU  */}
        <div>
          {!isOpen ? null : (
            <div className="ComponentMenu z-50 w-64 fixed left-0 top-0 h-screen p-4 bg-bg-blue grid auto-rows-max gap-4">
              <div className="grid grid-cols-[max-content_max-content] place-content-between px-2">
                <h3>Component Library</h3>
                <button onClick={() => toggleOpen(!isOpen)}>x</button>
              </div>
              <ul>
                {props.components.map((c) => {
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
        {/* END COMPONENT MENU  */}
        <div className="grid auto-rows-max gap-6 m-5">
          <div
            className={`
              ComponentViewPort
              grid auto-rows-max gap-6
              ${
                bg
                  ? "bg-white border border-grey-80 rounded-lg shadow-drop p-5"
                  : "bg-background"
              } 
            `}
          >
            {/* START STORY SELECTOR  */}
            <div className="grid auto-rows-max gap-1 p-4 border border-grey-80 rounded-md">
              {Object.keys(props.stories).map((key) => {
                console.log({ story, key });
                return (
                  <div className="flex flex-row gap-2 items-center" key={key}>
                    <input
                      checked={story === key}
                      type="radio"
                      name="story-select"
                      id={`${key}`}
                      onChange={() => setStory(key)}
                    ></input>

                    <label
                      htmlFor={`${key}`}
                      className={`text-grey-35  ${
                        story === key ? "font-bold" : ""
                      }`}
                    >
                      {key}
                    </label>
                  </div>
                );
              })}
            </div>
            {/* END STORY SELECTOR  */}

            {/* COMPONENT RENDERS HERE */}
            {props.children}
          </div>

          {/* FACT LIST HERE */}
          <AllFacts />
        </div>
      </div>{" "}
      {/* WRAPPER - CLOSE */}
    </LocalReplicacheProvider>
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

const BGSwitch = (props: {
  enabled: boolean;
  setEnabled: (b: boolean) => void;
}) => {
  return (
    <div className="flex gap-2">
      <span className="font-bold">Toggle Background</span>

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

const MenuIcon = () => {
  return (
    <svg
      width="22"
      height="24"
      viewBox="0 0 22 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 0C1.34315 0 0 1.28942 0 2.88V21.12C0 22.7106 1.34315 24 3 24H19C20.6569 24 22 22.7106 22 21.12V2.88C22 1.28942 20.6569 0 19 0H3ZM15 1.92V22.08H19C19.5523 22.08 20 21.6502 20 21.12V2.88C20 2.34981 19.5523 1.92 19 1.92H15ZM3 5.845C3 5.36175 3.39175 4.97 3.875 4.97L11.125 4.97C11.6082 4.97 12 5.36175 12 5.845C12 6.32825 11.6082 6.72 11.125 6.72L3.875 6.72C3.39175 6.72 3 6.32825 3 5.845ZM3.875 8.81003C3.39175 8.81003 3 9.20178 3 9.68503C3 10.1683 3.39175 10.56 3.875 10.56L11.125 10.56C11.6082 10.56 12 10.1683 12 9.68503C12 9.20178 11.6082 8.81003 11.125 8.81003L3.875 8.81003ZM3 13.525C3 13.0418 3.39175 12.65 3.875 12.65L11.125 12.65C11.6082 12.65 12 13.0418 12 13.525C12 14.0083 11.6082 14.4 11.125 14.4L3.875 14.4C3.39175 14.4 3 14.0083 3 13.525ZM3.875 16.49C3.39175 16.49 3 16.8818 3 17.365C3 17.8483 3.39175 18.24 3.875 18.24L11.125 18.24C11.6082 18.24 12 17.8483 12 17.365C12 16.8818 11.6082 16.49 11.125 16.49L3.875 16.49Z"
        fill="currentColor"
      />
    </svg>
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
  let componentLibraryPath = path.join(process.cwd(), "/pages/library/");
  let componentFiles = await fs.readdir(componentLibraryPath);
  let components = await Promise.all(
    componentFiles
      .filter((c) => c !== "index.tsx")
      .map(async (c) => {
        let component = await import("./" + c);
        return {
          path: `/library/${c.split(".")[0]}`,
          metadata: component.default.metadata as Metadata,
        };
      })
  );
  return { props: { components } };
}
