import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ref } from "data/Facts";
import { useAuth } from "hooks/useAuth";
import { useMutations } from "hooks/useReplicache";
import { useStudioData } from "hooks/useStudioData";
import { atom } from "jotai";
import { useState } from "react";
import { generateKeyBetween } from "src/fractional-indexing";
import { ulid } from "src/ulid";
import { ButtonTertiary } from "./Buttons";
import { Textarea } from "./Textarea";
import { create } from "zustand";
import { restrictToParentElement } from "@dnd-kit/modifiers";

export function CreateStudioPost(props: { id: string; latestPost?: string }) {
  let { data } = useStudioData(props.id);
  let { session } = useAuth();
  let [selectedSpaces, setSelectedSpace] = useState<string | null>(null);

  if (!data?.members_in_studios.find((m) => m.member === session?.user?.id))
    return null;

  return (
    <PostEditorDragContext>
      <div className="PostCreateWrapper flex w-full flex-col gap-2 rounded-md p-2">
        <Draggable id="space-selector">
          <SpaceSelector
            id={props.id}
            selectedSpaces={selectedSpaces}
            setSelectedSpace={setSelectedSpace}
          />
        </Draggable>
        <Draggable id="post-editor">
          <PostEditor
            id={props.id}
            latestPost={props.latestPost}
            selectedSpace={selectedSpaces}
          />
        </Draggable>
      </div>
    </PostEditorDragContext>
  );
}

function PostEditor(props: {
  id: string;
  latestPost?: string;
  selectedSpace: string | null;
}) {
  let { mutate, memberEntity } = useMutations();
  let [value, setValue] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <div className="flex w-96 flex-col gap-2 rounded-md border border-dashed bg-white p-2">
        <Textarea
          value={value}
          placeholder="post a note to the studio..."
          onChange={(e) => setValue(e.currentTarget.value)}
        />
        <hr className="border-color " />
      </div>
      <ButtonTertiary
        content="post"
        onClick={async () => {
          let entity = ulid();
          if (!memberEntity || !value) return;
          if (props.selectedSpace) {
            let spacePosition =
              useOffsetsState.getState().offsets["space-selector"];
            await mutate("assertFact", [
              {
                entity,
                attribute: "post/attached-space",
                value: props.selectedSpace,
                positions: {},
              },
              {
                entity,
                attribute: "post/space/position",
                positions: {},
                value: {
                  type: "position",
                  x: spacePosition?.x || 0,
                  y: spacePosition?.y || 0,
                  rotation: 0,
                  size: "small",
                },
              },
            ]);
          }
          let contentPosition =
            useOffsetsState.getState().offsets["post-editor"];

          await mutate("assertFact", [
            {
              entity,
              attribute: "post/content/position",
              positions: {},
              value: {
                type: "position",
                x: contentPosition?.x || 0,
                y: contentPosition?.y || 0,
                rotation: 0,
                size: "small",
              },
            },
            {
              entity,
              attribute: "card/content",
              value,
              positions: {},
            },
            {
              entity,
              attribute: "card/created-by",
              value: ref(memberEntity),
              positions: {},
            },
            {
              entity,
              attribute: "feed/post",
              value: generateKeyBetween(null, props.latestPost || null),
              positions: {},
            },
          ]);
          setValue("");
        }}
      />
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
  if (!open)
    return (
      <button className="w-fit border " onClick={() => setOpen(true)}>
        {props.selectedSpaces
          ? data?.spaces_in_studios.find(
              (s) => s.space === props.selectedSpaces
            )?.space_data?.display_name
          : "select a space"}
      </button>
    );
  return (
    <div className="flex flex-wrap gap-2">
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
            {s.space_data?.display_name}
          </button>
        );
      })}
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
              x: (s.offsets[active.id]?.x || 0) + delta.x,
              y: (s.offsets[active.id]?.y || 0) + delta.y,
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

let useOffsetsState = create(() => ({
  offsets: {} as { [key: string]: { y: number; x: number } },
}));

function Draggable(props: { id: string; children: React.ReactNode }) {
  let offset = useOffsetsState((s) => s.offsets[props.id]);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: props.id,
  });
  const style = {
    top: offset?.y || 0,
    left: offset?.x || 0,
    transform: `translate3d(${transform?.x || 0}px, ${transform?.y || 0}px, 0)`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative w-fit border-2 border-test-pink"
      {...attributes}
      {...listeners}
    >
      {props.children}
    </div>
  );
}
