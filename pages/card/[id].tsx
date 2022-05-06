import { getPhysicalCardById } from "backend/fauna/resources/functions/get_physical_card_by_id";
import { workerAPI } from "backend/lib/api";
import { ButtonPrimary } from "components/Buttons";
import { Client } from "faunadb";
import { GetServerSideProps } from "next";
import { redirect } from "next/dist/server/api-utils";
import { useState } from "react";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export default (props: { id: string }) => {
  let [link, setLink] = useState("");
  return (
    <div>
      <div>link a card {props.id}</div>
      <input value={link} onChange={(e) => setLink(e.currentTarget.value)} />
      <ButtonPrimary
        content="submit"
        onClick={async () => {
          let data = await workerAPI(WORKER_URL, "claim_card", {
            id: props.id,
            link,
          });
          if (data.success) window.location.assign(data.link);
        }}
      />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  let fauna = new Client({
    secret: process.env.FAUNA_KEY as string,
    domain: "db.us.fauna.com",
  });
  if (!ctx.params?.id) return { notFound: true };
  let physicalCard = await getPhysicalCardById(fauna, {
    id: ctx.params?.id as string,
  });
  console.log(physicalCard);
  if (physicalCard)
    return {
      redirect: { destination: physicalCard.link, permanent: true },
    };
  return { props: { id: ctx.params.id } };
};
