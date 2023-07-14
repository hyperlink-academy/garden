import { useAuth } from "hooks/useAuth";
import { useStudioData } from "hooks/useStudioData";
import { AddSpace } from "./AddSpace";
import { StudioOptionsMenu } from "./StudioOptionsMenu";
import type { View } from "pages/studio/[studio_id]";

export function StudioHeader(props: {
  id: string;
  view: View;
  setView: (view: View) => void;
}) {
  let { data } = useStudioData(props.id);
  let { session } = useAuth();
  return (
    <div className="studioHeader flex flex-col gap-8">
      <div className=" flex flex-col gap-2">
        <div className="studioTitle flex flex-row items-start justify-between gap-4">
          <h1>{data?.name}</h1>
          {/* TODO - replace this with updated 'authorized' in useMutations() */}
          {data?.members_in_studios.find(
            (m) => m.member === session?.user?.id
          ) && (
            <div className="flex flex-row items-center gap-2">
              <div className="hidden sm:block">
                <AddSpace id={props.id} />
              </div>
              <StudioOptionsMenu id={props.id} />
            </div>
          )}
        </div>
        <p className="studioDescription text-lg">{data?.description}</p>
        <div className="block sm:hidden ">
          <AddSpace id={props.id} />
        </div>
      </div>

      <div className="studioNav flex flex-col">
        <div className="flex justify-between gap-2">
          <div className="flex gap-2">
            <Tab
              view={props.view}
              setView={props.setView}
              value="posts"
              display="Posts"
            />
            <Tab
              view={props.view}
              setView={props.setView}
              value="spaces"
              display="Spaces"
            />
          </div>
          <Tab
            view={props.view}
            setView={props.setView}
            value="members"
            display="Members"
          />
        </div>
        <hr className="border border-accent-blue" />
      </div>
    </div>
  );
}

function Tab(props: {
  view: View;
  setView: (view: View) => void;
  value: View;
  display: string;
}) {
  return (
    <button
      onClick={() => props.setView(props.value)}
      className={`rounded-t-md border-2 border-b-0  py-1 px-2 ${
        props.view === props.value
          ? "border-accent-blue bg-bg-blue font-bold text-accent-blue"
          : "border-grey-55 bg-white text-grey-35"
      }`}
    >
      {props.display}
    </button>
  );
}
