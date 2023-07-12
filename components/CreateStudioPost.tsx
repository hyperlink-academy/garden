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
import { SpaceCard, SpaceData } from "./SpacesList";
import { RemoteCardData } from "./StudioPosts";
import { useSpaceID } from "hooks/useReplicache";
import { useSpaceData } from "hooks/useSpaceData";

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
      <div
        className="PostCreateWrapper flex w-full flex-col gap-2 rounded-md pb-[136px]"
        style={{
          marginBottom: -112 + "px",
          background: `repeating-linear-gradient(
            -58deg,
            #E6E6E6,
            #E6E6E6 1px,
            transparent 1px,
            transparent 8px
        )`,
        }}
      >
        {props.selectSpace && (
          <SpaceSelector
            id={props.id}
            selectedSpaces={selectedSpaces}
            setSelectedSpace={setSelectedSpace}
          />
        )}
        {props.remoteCard && (
          <DraggableRemoteCard
            space_data={cardSpaceData?.space_data}
            {...props.remoteCard}
          />
        )}
        <Draggable id="post-editor">
          <PostEditor
            onPost={props.onPost}
            id={props.id}
            selectedSpace={selectedSpaces}
          />
        </Draggable>
      </div>
    </PostEditorDragContext>
  );
}

function DraggableRemoteCard(props: Parameters<typeof RemoteCardData>[0]) {
  return (
    <Draggable id="remote-card">
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
  return (
    <Draggable id="space-selector" className={open ? "z-10" : ""}>
      {!open ? (
        <button className="w-fit" onClick={() => setOpen(true)}>
          {props.selectedSpaces ? (
            <SpaceCard
              small
              {...(data?.spaces_in_studios.find(
                (s) => s.space === props.selectedSpaces
              )?.space_data as SpaceData)}
            />
          ) : (
            "select a space"
          )}
        </button>
      ) : (
        <div
          className="flex flex-col gap-2 rounded-md border border-grey-80 bg-bg-blue px-4 py-2"
          onBlur={() => setOpen(false)}
        >
          <h3>Highlight A Space</h3>
          <div className="flex flex-wrap gap-2 ">
            <button
              className={`rounded-md border py-1 px-2 ${
                !props.selectedSpaces
                  ? "border-accent-blue bg-accent-blue text-white"
                  : "border-grey-80 hover:border-accent-blue hover:bg-bg-blue"
              }`}
              onClick={() => {
                props.setSelectedSpace(null);
                setOpen(false);
              }}
            >
              no space
            </button>
            {data?.spaces_in_studios.map((s) => {
              if (!s.space) return;
              let spaceID = s.space;
              if (s.space === props.selectedSpaces)
                return <SpaceCard small {...(s.space_data as SpaceData)} />;
              return (
                <button
                  className={`rounded-md border py-1 px-2 ${
                    props.selectedSpaces === spaceID
                      ? "border-accent-blue bg-accent-blue text-white"
                      : "border-grey-80 hover:border-accent-blue hover:bg-bg-blue"
                  }`}
                  key={spaceID}
                  onClick={() => {
                    props.setSelectedSpace(spaceID);
                    setOpen(false);
                  }}
                >
                  <DoorImage
                    width="64"
                    small
                    image={s.space_data?.image}
                    default_space_image={s.space_data?.default_space_image}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Draggable>
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
      onDragMove={async ({ active: activeData }) => {}}
    >
      {props.children}
    </DndContext>
  );
}

function Draggable(props: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  let offset = useOffsetsState((s) => s.offsets[props.id]);
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
      className={`relative w-fit ${props.className || ""}`}
      {...attributes}
      {...listeners}
    >
      {props.children}
    </div>
  );
}
