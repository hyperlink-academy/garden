import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useAuth } from "hooks/useAuth";
import { useStudioData } from "hooks/useStudioData";
import { useState } from "react";
import { ButtonTertiary } from "./Buttons";
import { Textarea } from "./Textarea";
import { create } from "zustand";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { DoorImage } from "./Doors";
import { BaseSpaceCard, SpaceData } from "./SpacesList";
import { RemoteCardData } from "./StudioPosts";
import { useSpaceID } from "hooks/useReplicache";

let useOffsetsState = create(() => ({
  offsets: {} as { [key: string]: { y: number; x: number } },
}));
export function CreateStudioPost(props: {
  onPost: (args: {
    value: string;
    cardPosition?: { x: number; y: number };
    contentPosition?: { x: number; y: number };
    spacePosition?: { x: number; y: number };
    selectedSpace?: string | null;
  }) => void;
  id: string;
  selectSpace?: boolean;
  remoteCard?: { cardEntity: string; space_do_id: string };
}) {
  let id = useSpaceID();

  let { data } = useStudioData(props.id);
  let { session } = useAuth();
  let [selectedSpaces, setSelectedSpace] = useState<string | null>(null);

  if (!data?.members_in_studios.find((m) => m.member === session?.user?.id))
    return null;

  let cardSpaceData = data?.spaces_in_studios.find((s) => s.space === id);

  return (
    <PostEditorDragContext>
      <div className="flex flex-col-reverse gap-1">
        <div
          className="PostCreateWrapper relative flex w-full flex-col gap-2 rounded-md pb-48"
          style={{
            background: `repeating-linear-gradient(
            -58deg,
            #E6E6E6,
            #E6E6E6 1px,
            transparent 1px,
            transparent 8px
        )`,
          }}
        >
          {props.remoteCard && cardSpaceData && (
            <DraggableRemoteCard
              space_data={cardSpaceData.space_data}
              {...props.remoteCard}
            />
          )}
          {selectedSpaces && (
            <Draggable id="space-selector" default_position={{ x: 16, y: 16 }}>
              <BaseSpaceCard
                small
                {...(data?.spaces_in_studios.find(
                  (s) => s.space === selectedSpaces
                )?.space_data as SpaceData)}
              />
            </Draggable>
          )}
          <Draggable
            id="post-editor"
            default_position={{ y: 32, x: 32 }}
            relative
          >
            <PostEditor
              onPost={props.onPost}
              id={props.id}
              selectedSpace={selectedSpaces}
            />
          </Draggable>
        </div>
        {props.selectSpace && (
          <div className="relative flex h-6 w-full flex-row gap-2">
            <div className="italic text-grey-35">drag to position.</div>
            <SpaceSelector
              id={props.id}
              selectedSpaces={selectedSpaces}
              setSelectedSpace={setSelectedSpace}
            />
          </div>
        )}
      </div>
    </PostEditorDragContext>
  );
}

function DraggableRemoteCard(props: Parameters<typeof RemoteCardData>[0]) {
  return (
    <Draggable id="remote-card" default_position={{ x: 16, y: 64 }}>
      <RemoteCardData {...props} />
    </Draggable>
  );
}

function PostEditor(props: {
  onPost: (args: {
    value: string;
    cardPosition?: { x: number; y: number };
    contentPosition?: { x: number; y: number };
    spacePosition?: { x: number; y: number };
    selectedSpace?: string | null;
  }) => void;
  remoteCard?: { cardEntity: string; space_do_id: string };
  id: string;
  selectedSpace: string | null;
}) {
  let { identityData } = useAuth();
  let [value, setValue] = useState("");

  const onClick = async () => {
    props.onPost({
      value,
      cardPosition: useOffsetsState.getState().offsets["remote-card"],
      contentPosition: useOffsetsState.getState().offsets["post-editor"],
      spacePosition: useOffsetsState.getState().offsets["space-selector"],
      selectedSpace: props.selectedSpace,
    });
    setValue("");
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex w-96 flex-col gap-2 rounded-lg border border-dashed border-grey-80 bg-white p-2">
        <Textarea
          value={value}
          placeholder="post a note to the studio..."
          onChange={(e) => setValue(e.currentTarget.value)}
        />
        <hr className="border-grey-80" />
        <div className="text-right font-bold text-grey-55">
          {identityData?.username}
          {props.remoteCard ? <span>hello</span> : null}
        </div>
      </div>
      <div className="absolute -bottom-10 right-0 flex justify-end">
        <ButtonTertiary
          onClick={onClick}
          content="post"
          className="bg-background"
        />
      </div>
    </div>
  );
}

function SpaceSelector(props: {
  id: string;
  selectedSpaces: string | null;
  setSelectedSpace: (spaces: string | null) => void;
}) {
  let [open, setOpen] = useState(false);
  let { data } = useStudioData(props.id);
  if (!open) {
    return (
      <button
        className="w-fit italic text-accent-blue hover:underline"
        onClick={() => setOpen(true)}
      >
        {props.selectedSpaces ? "change space" : "highlight a space"}
      </button>
    );
  }

  return (
    <div
      className="absolute flex w-full flex-col gap-2 rounded-md border border-grey-80 bg-bg-blue px-4 py-2"
      onBlur={() => setOpen(false)}
    >
      <h3>Highlight A Space</h3>
      <div className="flex flex-wrap gap-2 ">
        <button
          onClick={() => {
            props.setSelectedSpace(null);
            setOpen(false);
          }}
        >
          <NoSpace />
        </button>
        {data?.spaces_in_studios.map((s) => {
          if (!s.space) return;
          let spaceID = s.space;
          if (s.space === props.selectedSpaces)
            return <BaseSpaceCard small {...(s.space_data as SpaceData)} />;
          return (
            <button
              key={spaceID}
              onClick={() => {
                props.setSelectedSpace(spaceID);
                setOpen(false);
              }}
            >
              <BaseSpaceCard small {...(s.space_data as SpaceData)} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PostEditorDragContext(props: { children: React.ReactNode }) {
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 4 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 264, tolerance: 4 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);
  return (
    <DndContext
      sensors={sensors}
      modifiers={[restrictToParentElement]}
      onDragEnd={async ({ active, delta }) => {
        useOffsetsState.setState((s) => ({
          offsets: {
            ...s.offsets,
            [active.id]: {
              x: (s.offsets[active.id]?.x || 8) + delta.x,
              y: (s.offsets[active.id]?.y || 8) + delta.y,
            },
          },
        }));
      }}
    >
      {props.children}
    </DndContext>
  );
}

function Draggable(props: {
  relative?: boolean;
  id: string;
  default_position: { x: number; y: number };
  children: React.ReactNode;
  className?: string;
}) {
  let offset =
    useOffsetsState((s) => s.offsets[props.id]) || props.default_position;
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: props.id,
  });
  const style = {
    top: offset?.y || 8,
    left: offset?.x || 8,
    transform: `translate3d(${transform?.x || 0}px, ${transform?.y || 0}px, 0)`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${props.relative ? "relative" : "absolute"} w-fit ${
        props.className || ""
      }`}
      {...attributes}
      {...listeners}
    >
      {props.children}
    </div>
  );
}

const NoSpace = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256.89 330.35"
    width={64}
  >
    <defs>
      <style>
        {
          ".no-space-cls-1{fill:#8c8c8c;}.no-space-cls-2{fill:#e6e6e6;}.no-space-cls-3{fill:#cccccb;}"
        }
      </style>
    </defs>
    <g id="Door_Small" data-name="Door Small">
      <path
        className="no-space-cls-1"
        d="M192.65,66l5.65-20.42-7.89-6.66c-11.77-5.2-22.56-6.9-33.16-8.27C103.49,23.68,50.88,78.78,39.63,160c-9.27,66.92,12.46,127.49,50.43,150.9h0l.63.37.56.34,29.68,14,1.26-4.56A70.57,70.57,0,0,0,147,325.61c53.66,0,97.16-61.72,97.16-137.87C244.2,135,223.32,89.18,192.65,66Z"
      />
      <path
        className="no-space-cls-2"
        d="M165.91,228.91a5.12,5.12,0,0,0,5.72,1.71,9.14,9.14,0,0,0,4.16-2.7c3.15-3.46,4-8.62,1.84-11.61L146.06,171.9l34.41-55.27c2.41-3.86,1.87-9.24-1.23-12.07s-7.78-2.1-10.32,1.84L136,157.71,99.18,106a10.52,10.52,0,1,0-17,12.44L125,174.84,82.73,240.57c-3.37,5.25-2.31,11.09,2.33,13a9.22,9.22,0,0,0,6,.14,14.32,14.32,0,0,0,8-6.14l36.55-58.71Z"
      />
      <path
        className="no-space-cls-2"
        d="M179.58,68.2c22.53,22.47,34.27,65.79,27.7,113.2-9.07,65.51-49.67,114-90.68,108.33-.54-.07-1.08-.16-1.61-.25,8.6,8.58,18.77,14.13,30.1,15.7,41,5.68,81.6-42.82,90.68-108.33C244.73,132.2,219.65,75.15,179.58,68.2Z"
      />
      <path
        className="no-space-cls-3"
        d="M177.42,35.74C123.73,28.3,71.09,88.1,59.83,169.32S83,322.4,136.67,329.83,243,277.47,254.26,196.26,231.11,43.18,177.42,35.74Zm58.35,161.11c-9.08,65.51-49.67,114-90.68,108.33s-66.88-63.4-57.81-128.91S137,62.26,178,67.94,244.85,131.33,235.77,196.85Z"
      />
      <path
        className="no-space-cls-1"
        d="M226.56,109.55C215.5,84.87,198.29,69.74,178.1,67S137.24,74,119.88,94.76s-29.17,49.5-33.59,81.37-.79,62.92,10.21,87.44c11.06,24.67,28.27,39.8,48.45,42.6a49.39,49.39,0,0,0,6.75.46c18,0,36.05-9.85,51.47-28.28,17.25-20.6,29.18-49.5,33.59-81.37S237.56,134.06,226.56,109.55ZM201.64,277.07c-16.9,20.18-36.93,29.81-56.41,27.12s-36.14-17.42-46.91-41.44c-10.84-24.18-14.41-54.84-10-86.34s16.14-60,33.15-80.36c15-18,32.55-27.57,50-27.57a46.76,46.76,0,0,1,6.46.45c1,.14,2,.31,3,.52a88.08,88.08,0,0,1,17.5,27.69c21.25,5.85,34.59,34.82,38.27,71a188.44,188.44,0,0,1-1.79,28.62C230.42,228.21,218.65,256.75,201.64,277.07Z"
      />
    </g>
  </svg>
);
