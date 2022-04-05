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
  return (
    <LocalReplicacheProvider
      defaultFacts={story ? props.stories[story].entities : []}
    >
      <h1 className="text-4xl pt-12 pb-8">Component Library</h1>
      <div className="grid grid-cols-[160px_1fr_300px] gap-4 ">
        {/* START COMPONENT MENU  */}
        <ul className="z-10">
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
        {/* END COMPONENT MENU  */}

        {/* START COMPONENT VIEW WINDOW  */}
        <div className="border border-grey-55 rounded-md bg-white p-8">
          {props.children}
        </div>
        {/* END COMPONENT VIEW WINDOW  */}

        {/* START STORIES AND FACTS  */}
        <div className="grid gap-4">
          <div>
            <h2 className="text-2xl pb-3">Stories</h2>
            {Object.keys(props.stories).length === 0
              ? "nothing to see here 🙈"
              : Object.keys(props.stories).map((key) => {
                  return (
                    <div
                      className="grid grid-cols-[max-content_max-content] gap-2"
                      key={key}
                    >
                      <input
                        type="radio"
                        name="story-select"
                        id={`${key}`}
                        className={`${story === key ? "underline" : ""}`}
                        onClick={() => setStory(key)}
                      ></input>

                      <label
                        htmlFor={`${key}`}
                        className="text-grey-35 font-bold"
                      >
                        {key}
                      </label>
                    </div>
                  );
                })}
          </div>
          <AllFacts />
        </div>
        {/* START STORIES AND FACTS  */}
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
