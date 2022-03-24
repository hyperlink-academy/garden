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
  return (
    <LocalReplicacheProvider
      defaultFacts={story ? props.stories[story].entities : []}
    >
      <h1 className="text-4xl">Component Library</h1>
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 200px" }}>
        <ul>
          {props.components.map((c) => {
            return (
              <li key={c.path}>
                <Link href={c.path}>
                  <a>{c.metadata.name}</a>
                </Link>
              </li>
            );
          })}
        </ul>
        <div>{props.children}</div>
        <div className="grid gap-4">
          <div>
            <h2 className="text-2xl">Stories</h2>
            {Object.keys(props.stories).map((key) => {
              return (
                <div>
                  <button
                    className={`${story === key ? "underline" : ""}`}
                    onClick={() => setStory(key)}
                  >
                    {key}
                  </button>
                </div>
              );
            })}
          </div>
          <AllFacts />
        </div>
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
  return (
    <div>
      <h2 className="text-2xl">All Facts</h2>
      <ul className="grid gap-2">
        {facts.map((f) => {
          return (
            <ul key={f.id} className="p-2 border-2">
              <li>entity: {f.entity} </li>
              <li>attribute: {f.attribute}</li>
              <li>value: {f.value}</li>
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
