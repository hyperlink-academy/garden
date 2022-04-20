import { useIndex } from "hooks/useReplicache";

export const Backlinks = (props: { entityID: string }) => {
  let backlinks = useIndex.vae(props.entityID);
  return (
    <div>
      <h3>Backlinks</h3>
      <ul>
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
      {name?.value} - {props.attribute}
    </li>
  );
};
