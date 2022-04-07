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
import { Fact } from "data/Facts";
import { useRouter } from "next/router";
import { Switch } from "@headlessui/react";

export type Props = InferGetStaticPropsType<typeof getStaticProps>;

type Metadata = {
  name: string;
};

export type Stories = {
  [k: string]: {
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
  let [open, setOpen] = useState(false);
  let [bg, setBg] = useState(true);
  return (
    <LocalReplicacheProvider
      defaultFacts={story ? props.stories[story].entities : []}
    >
      <h1 className="text-4xl pt-12 pb-8">Component Library</h1>
      <div className="flex gap-4 justify-between">
        <button onClick={() => setOpen((o) => !o)}>
          {open ? "close" : "open"}
        </button>
        <BGSwitch enabled={bg} setEnabled={setBg} />
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-4 ">
        {/* START COMPONENT MENU  */}
        <div>
          {!open ? null : (
            <ul className="z-10 w-40">
              {props.components.map((c) => {
                return (
                  <li key={c.path}>
                    <div
                      className={`px-1 py-0.5 font-bold  
                  ${
                    c.path === router.pathname
                      ? "text-accent-blue border-2 rounded-md bg-white"
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
          )}
        </div>
        {/* END COMPONENT MENU  */}

        {/* START COMPONENT VIEW WINDOW  */}
        <div className="flex flex-col gap-8">
          {/* START STORIES AND FACTS  */}
          <div className="flex flex-row gap-4 items-center flex-wrap w-full">
            {Object.keys(props.stories).map((key) => {
              console.log({ story, key });
              return (
                <div className="flex flex-row gap-2 items-center" key={key}>
                  <input
                    checked={story === key}
                    type="radio"
                    name="story-select"
                    id={`${key}`}
                    onClick={() => setStory(key)}
                  ></input>

                  <label
                    htmlFor={`${key}`}
                    className={`text-grey-35 font-bold ${
                      story === key ? "underline" : ""
                    }`}
                  >
                    {key}
                  </label>
                </div>
              );
            })}
          </div>
          {/* END STORIES*/}
          <div
            className={`border border-grey-55 rounded-md ${
              bg ? "bg-white" : "bg-background"
            } p-8`}
          >
            {props.children}
          </div>
          <AllFacts />
        </div>
        {/* END COMPONENT VIEW WINDOW  */}
      </div>
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
      <Switch
        checked={props.enabled}
        onChange={props.setEnabled}
        className={`${
          props.enabled ? "bg-bg-blue" : "bg-grey-80"
        } relative inline-flex items-center h-6 rounded-full w-11`}
      >
        <span className="sr-only">Toggle background</span>
        <span
          className={`${
            props.enabled ? "translate-x-6" : "translate-x-1"
          } inline-block w-4 h-4 transform bg-white rounded-full`}
        />
      </Switch>
      <span>Toggle bg</span>
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
