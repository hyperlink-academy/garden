import { DeckSmall, SectionLinkedCard } from "components/Icons";
import { Divider } from "components/Layout";
import { useIndex } from "hooks/useReplicache";

export const Backlinks = (props: { entityID: string }) => {
  let backlinks = useIndex.vae(props.entityID);
  return (
    <div className=" grid grid-flow-row gap-2">
      <Divider />
      <h3>This card appears in...</h3>
      <ul className=" grid grid-flow-row gap-2">
        {backlinks.map((b) => {
          return <Backlink entity={b.entity} attribute={b.attribute} />;
        })}
      </ul>
    </div>
  );
};

const Backlink = (props: { entity: string; attribute: string }) => {
  let name = useIndex.eav(props.entity, "card/title");
  return (
    <li>
      {props.attribute === "deck/contains" ? (
        <div className="">
          <div className="grid grid-cols-[max-content_auto] gap-2 ">
            <h4> Decks </h4>
          </div>
          <div className="grid grid-cols-[max-content_max-content_auto] gap-2 ">
            <div className="border-b-2 border-l-2 w-3 h-1/2 ml-5"></div>
            <p className="lightBorder p-2 font-bold">{name?.value}</p>
          </div>
        </div>
      ) : (
        <div className="">
          <div className="grid grid-cols-[max-content_auto] gap-2 ">
            <h4> {props.attribute.slice(8)}</h4>
          </div>
          <div className="grid grid-cols-[max-content_max-content_auto] gap-2 ">
            <div className="border-b-2 border-l-2 w-3 h-1/2 ml-5"></div>
            <p className="lightBorder p-2 font-bold">{name?.value}</p>
          </div>
          {/* <div className="grid grid-cols-[max-content_auto] gap-2 lightBorder p-2">
            <p className=""> {name?.value}</p>
          </div>
          <div className="grid grid-cols-[max-content_auto] gap-2">
            <div className="border-b-2 border-l-2 w-3 h-1/2 ml-5"></div>
            <h4>
              <span className="font-normal">in </span>
              {props.attribute.slice(8)} Section
            </h4>
          </div> */}
        </div>
      )}
    </li>
  );
};
