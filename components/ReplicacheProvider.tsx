import { spaceAPI, workerAPI } from "backend/lib/api";
import { z } from "zod";
import { pullRoute } from "backend/SpaceDurableObject/routes/pull";
import {
  FactWithIndexes,
  makeReplicache,
  MessageWithIndexes,
  ReplicacheContext,
} from "hooks/useReplicache";
import { useEffect, useRef, useState } from "react";
import { PullRequest, PushRequest } from "replicache";
import { useAuth } from "hooks/useAuth";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL as string;
export const SpaceProvider: React.FC<{ id: string }> = (props) => {
  let [rep, setRep] = useState<ReturnType<typeof makeReplicache>>();
  let socket = useRef<WebSocket>();
  useEffect(() => {
    if (!props.id || !rep) return;
    socket.current = new WebSocket(`${SOCKET_URL}/space/${props.id}/socket`);
    socket.current.addEventListener("message", () => {
      rep?.pull();
    });
    return () => {
      socket.current?.close();
    };
  }, [props.id, rep]);

  let { session } = useAuth();
  useEffect(() => {
    let rep = makeSpaceReplicache({
      id: props.id,
      session: session.session?.studio,
      token: session.token,
    });
    setRep(rep);
    return () => {
      rep.close();
    };
  }, [props.id, session.token, session.session?.studio]);
  return (
    <ReplicacheContext.Provider value={rep ? { rep, id: props.id } : null}>
      {props.children}
    </ReplicacheContext.Provider>
  );
};

export const prefetchSpaceId = (studio: string, space: string) => {
  let id = workerAPI(WORKER_URL, "get_space", {
    studio: studio,
    space: space,
  });
  mutate("/studio/" + studio + "/space/" + space, id);
};

export const SpaceSpaceProvider: React.FC<{
  loading: React.ReactElement;
  notFound: React.ReactElement;
}> = (props) => {
  let router = useRouter();
  let { data: id } = useSWR(
    "/studio/" + router.query.studio + "/space/" + router.query.space,
    () => {
      let id = workerAPI(WORKER_URL, "get_space", {
        studio: router.query.studio as string,
        space: router.query.space as string,
      });
      return id;
    },
    { revalidateOnFocus: false }
  );
  if (!id) return props.loading;
  if (!id.success) return props.notFound;
  return <SpaceProvider id={id.id}>{props.children}</SpaceProvider>;
};

export const makeSpaceReplicache = ({
  id,
  session,
  token,
}: {
  id: string;
  session?: string;
  token?: string;
}) =>
  makeReplicache({
    name: `space-${id}-${session}`,
    pusher: async (request) => {
      let data: PushRequest = await request.json();
      if (!token)
        return { httpStatusCode: 200, errorMessage: "no user logged in" };
      await spaceAPI(`${WORKER_URL}/space/${id}`, "push", {
        ...data,
        token: token,
      });
      return { httpStatusCode: 200, errorMessage: "" };
    },
    puller: async (request) => {
      let data: PullRequest = await request.json();
      let result = await spaceAPI(
        `${WORKER_URL}/space/${id}`,
        "pull",
        data as z.infer<typeof pullRoute.input>
      );
      let ops = result.data.map((fact) => {
        if (fact.retracted)
          return {
            op: "del",
            key: fact.id,
          } as const;
        return {
          op: "put",
          key: fact.id,
          value: FactWithIndexes(fact),
        } as const;
      });
      let messageOps = result.messages.map((m) => {
        return {
          op: "put",
          key: m.id,
          value: MessageWithIndexes(m),
        } as const;
      });
      return {
        httpRequestInfo: { httpStatusCode: 200, errorMessage: "" },
        response: {
          lastMutationID: result.lastMutationID,
          cookie: result.cookie,
          patch: [...ops, ...messageOps],
        },
      };
    },
  });
