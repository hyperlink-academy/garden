import { CardCarousel } from "components/CardCarousel";
import { AttributeFromShortCode, ReferenceAttributes } from "data/Attributes";
import { multipleReferenceSection } from "data/Facts";
import { useIndex } from "hooks/useReplicache";
import { useRouter } from "next/router";
import { sortByPosition } from "src/position_helpers";

export default function DeckPage() {
  let router = useRouter();
  let attribute = router.query.attribute as string;
  let card = router.query.card as string;

  let section: keyof ReferenceAttributes =
    (AttributeFromShortCode(attribute) as keyof ReferenceAttributes) ||
    multipleReferenceSection(attribute);

  let cards = useIndex.vae(card, section)?.sort(sortByPosition("vae")) || [];
  return (
    <CardCarousel
      entityID={card}
      section={section}
      cards={cards}
      backlink={true}
    />
  );
}
