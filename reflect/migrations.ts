import { spaceAPI } from "backend/lib/api";
import { WriteTransaction } from "@rocicorp/reflect";
import { FactIndexes, MessageIndexes } from "./";
import { WORKER_URL } from "src/constants";

type Migration = {
  date: string;
  run: (tx: WriteTransaction, ctx: { roomID: string }) => Promise<void>;
};

export const migrations: Migration[] = [
  {
    date: "2023-11-01",
    run: async (tx, ctx) => {
      let data = await spaceAPI(`${WORKER_URL}/space/${ctx.roomID}`, "pull", {
        clientID: "",
        cookie: undefined,
        lastMutationID: 0,
        pullVersion: 0,
        schemaVersion: "",
      });

      for (let fact of data.data) {
        if (fact.retracted) continue;
        let indexes = FactIndexes(fact, fact.schema);
        for (let key of Object.values(indexes)) {
          await tx.set(key, fact);
        }
      }

      for (let message of data.messages) {
        let indexes = MessageIndexes(message);
        for (let key of Object.values(indexes)) {
          if (key) await tx.set(key, message);
        }
      }
      await tx.set("initialized", true);
    },
  },
];

//Okay now I need to decide where to put the initialization code to create the
//files I need.
//
//Space initialization needs: rooms created + cards
//Also need to create member data for the owner.
