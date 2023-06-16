import { spaceAPI, workerAPI } from "backend/lib/api";
import { ButtonPrimary, ButtonTertiary } from "components/Buttons";
import { MoreOptionsSmall } from "components/Icons";
import { StudioOptionsMenu } from "components/StudioPage/StudioOptionsMenu";
import { useAuth } from "hooks/useAuth";
import { useStudioData } from "hooks/useStudioData";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import Router, { useRouter } from "next/router";
import { useEffect } from "react";

type Props = InferGetStaticPropsType<typeof getStaticProps>;
export default function StudioPage(props: Props) {
  let { query, push } = useRouter();

  let code = query.code as string | undefined;
  let { data } = useStudioData(query.studio_id as string, props.data);
  let { session, authToken } = useAuth();
  useEffect(() => {
    if (
      session.user &&
      data?.members_in_studios?.find(
        ({ member }) => session.user && session.user.id === member
      )
    ) {
      Router.push(`/studio/${query.studio_id}`);
    }
  }, [data, session.user]);
  return (
    <div>
      <div className="flex flex-row justify-between">
        <h1>{data?.name}</h1>
      </div>
      {data?.description}
      <div className="m-auto max-w-xl rounded-md border">
        <h2>Welcome!</h2>
        <ButtonPrimary
          content="Join"
          onClick={async () => {
            if (!props.data || !authToken || !code) return;
            let data = await spaceAPI(
              `${WORKER_URL}/space/${props.data?.do_id}`,
              "join",
              {
                authToken,
                code,
              }
            );
            if (data.success) {
              push(`/studio/${query.studio_id}`);
            }
          }}
        />
      </div>
    </div>
  );
}

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export async function getStaticProps(ctx: GetStaticPropsContext) {
  if (!ctx.params?.studio_id)
    return { props: { notFound: true }, revalidate: 10 } as const;
  let data = await workerAPI(WORKER_URL, "get_studio_data", {
    id: ctx.params?.studio_id as string,
  });

  if (!data.success)
    return { props: { notFound: true }, revalidate: 10 } as const;
  return { props: { notFound: false, data: data.data } };
}

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}
