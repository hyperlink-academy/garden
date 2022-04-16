import { ButtonSecondary } from "components/Buttons";
import { FindOrCreate } from "components/FindOrCreateEntity";
import { Add, SectionLinkedCard, SectionText } from "components/Icons";
import { Divider } from "components/Layout";
import { ReplicacheContext, useIndex } from "hooks/useReplicache";
import { useContext, useState } from "react";
import { ulid } from "src/ulid";

export const AddSection = (props: { cardEntity: string }) => {
  let [open, setOpen] = useState(false);
  let rep = useContext(ReplicacheContext);
  let [section, setSection] = useState({
    name: "",
    type: "string" as "reference" | "string",
  });
  let cardSections = useIndex.eav(props.cardEntity, "card/section");
  let sections = useIndex
    .aev("name")
    .filter(
      (f) =>
        f.value.startsWith("section") &&
        !cardSections?.find((c) => f.value === `section/${c.value}`)
    );
  let types = useIndex.aev("type");

  let existingSection = sections.find(
    (f) => f.value === `section/${section.name}`
  );
  let existingSectionType = types.find(
    (f) => f.entity === existingSection?.entity
  );

  let type = existingSectionType?.value || section.type;

  return (
    <div className="addSectionButton grid grid-auto-row gap-2 pb-6">
      <Divider />
      {!open ? (
        <button
          className="flex gap-2 text-grey-80"
          onClick={() => setOpen(true)}
        >
          <Add />
          <h4 className="text-grey-80 ">Add Section</h4>
        </button>
      ) : (
        <div>
          <div className="grid grid-flow-col gap-4 grid-cols-[auto,min-content]">
            <SectionNamePicker
              items={sections.map((s) => {
                let type = types.find((f) => f.entity === s.entity);
                return {
                  entity: s.entity,
                  display: s.value.slice(8),
                  icon:
                    type?.value === "string" ? (
                      <SectionText />
                    ) : (
                      <SectionLinkedCard />
                    ),
                };
              })}
              name={section.name}
              setName={(e) => setSection({ ...section, name: e })}
            />
            <div className="flex flex-row items-center w-min gap-2">
              <button
                onClick={() => setSection({ ...section, type: "string" })}
              >
                <SectionText
                  className={
                    type === "string" ? "text-grey-15" : "text-grey-55"
                  }
                />
              </button>
              <button
                onClick={() => setSection({ ...section, type: "reference" })}
              >
                <SectionLinkedCard
                  className={
                    type === "reference" ? "text-grey-15" : "text-grey-55"
                  }
                />
              </button>
            </div>
          </div>
          <ButtonSecondary
            content="Add Section"
            onClick={async () => {
              await rep?.rep.mutate.addSection({
                newSectionEntity: ulid(),
                sectionName: section.name,
                type: type as "reference" | "string",
                cardEntity: props.cardEntity,
                positions: "",
              });
              setOpen(false);
              setSection({ ...section, name: "" });
            }}
          />
        </div>
      )}
    </div>
  );
};

const SectionNamePicker = (props: {
  name: string;
  items: { entity: string; display: string; icon: React.ReactElement }[];
  setName: (s: string) => void;
}) => {
  let [open, setOpen] = useState(false);
  return (
    <div>
      <button
        className="w-full p-2 rounded-md bg-white border-grey-55 border text-left"
        onClick={() => setOpen(true)}
      >
        {props.name || ""}
      </button>
      <FindOrCreate
        open={open}
        onSelect={(e) => {
          if (e.type === "create") props.setName(e.name);
          else {
            let name = props.items.find((s) => s.entity === e.entity)?.display;
            if (name) props.setName(name);
          }
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
        items={props.items}
        selected={[
          props.items.find((f) => f.display === props.name)?.entity || "",
        ]}
      />
    </div>
  );
};
