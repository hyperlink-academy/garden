import { Reflect } from "@rocicorp/reflect/client";
import { ReplicacheMutators, scanIndex } from "reflect";
import { useAuth } from "./useAuth";
import { useEffect, useState } from "react";
import { useSubscribe } from "replicache-react";
import { makeReflect } from "components/ReplicacheProvider";

export const useRemoteCardData = (do_id?: string, cardEntity?: string) => {
  let { session, authToken } = useAuth();
  let [rep, setRep] = useState<Reflect<ReplicacheMutators>>();

  useEffect(() => {
    if (!do_id) return;
    let newRep = makeReflect({
      authToken,
      studio: session.session?.studio || "unauthorized",
      id: do_id,
    });
    setRep(newRep);
    return () => {
      newRep.close();
      setRep(undefined);
    };
  }, [do_id, authToken, session.session?.studio]);
  let data = useSubscribe(
    rep,
    async (tx) => {
      if (!cardEntity) return null;
      let title = await scanIndex(tx).eav(cardEntity, "card/title");

      let content = await scanIndex(tx).eav(cardEntity, "card/content");
      let creator = await scanIndex(tx).eav(cardEntity, "card/created-by");
      let creatorName;
      if (creator)
        creatorName = await scanIndex(tx).eav(
          creator?.value.value,
          "member/name"
        );

      return {
        title: title?.value || "",
        content: content?.value || "",
        creator: creatorName?.value || "",
      };
    },
    null,
    [cardEntity]
  );

  return { data };
};
