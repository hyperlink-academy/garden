import { spaceAPI, workerAPI } from "backend/lib/api";
import { ButtonPrimary, ButtonSecondary } from "components/Buttons";
import { Member } from "components/Icons";
import { BaseSmallCard } from "components/CardPreview/SmallCard";
import { useAuth } from "hooks/useAuth";
import { db, useSpaceID } from "hooks/useReplicache";
import { useRouter } from "next/router";
import { SVGProps, useEffect, useState } from "react";
import { LogInModal, SignupModal } from "components/LoginModal";
import Head from "next/head";
import { useSpaceData } from "hooks/useSpaceData";
import Link from "next/link";
import { SpaceCard, SpaceData } from "components/SpacesList";
import { Divider } from "components/Layout";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import { SpaceProvider } from "components/ReplicacheProvider";

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps(ctx: GetStaticPropsContext) {
  if (!ctx.params?.space || !ctx.params?.studio)
    return { props: { notFound: true }, revalidate: 10 } as const;
  let data = await workerAPI(WORKER_URL, "get_space_data_by_name", {
    spaceName: ctx.params?.space as string,
    username: ctx.params?.studio as string,
  });

  if (!data.success)
    return { props: { notFound: true }, revalidate: 10 } as const;
  return { props: { notFound: false, data: data.data } };
}

type Props = InferGetStaticPropsType<typeof getStaticProps>;
export default function JoinSpacePage(props: Props) {
  let { data } = useSpaceData(props.data?.do_id, props.data);
  if (props.notFound) return <div>404 - page not found!</div>;

  return (
    <SpaceProvider id={props.data.do_id}>
      <JoinSpace />
    </SpaceProvider>
  );
}
const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL as string;
export function JoinSpace() {
  let id = useSpaceID();
  let { session, authToken } = useAuth();
  let router = useRouter();
  let code = router.query.code as string | undefined;
  let isMember = db.useUniqueAttribute("space/member", session.session?.studio);
  let { data } = useSpaceData(id);

  let [state, setState] = useState<"normal" | "signup" | "login">("normal");

  const onClick = async () => {
    if (!authToken || !code || isMember || !id) return;
    let data = await spaceAPI(`${WORKER_URL}/space/${id}`, "join", {
      authToken,
      code,
    });
    if (data.success) {
      router.push(`/s/${router.query.studio}/s/${router.query.space}`);
    }
  };
  useEffect(() => {
    if (!!isMember)
      router.push(`/s/${router.query.studio}/s/${router.query.space}`);
  }, [!!isMember]);

  return (
    <>
      <Head>
        <title key="title">{data?.display_name}: you&apos;re invited!</title>
      </Head>

      <div className="mx-auto flex max-w-3xl flex-col place-items-center gap-6 px-4 py-8">
        <h2>Welcome!</h2>
        <p className="text-center text-lg">
          You&apos;ve been invited to join a{" "}
          <strong>
            Space<sup className="text-grey-55">†</sup>
          </strong>
          :{" "}
        </p>
        <div className="-mt-4">
          <SpaceCard small {...(data as SpaceData)} />
        </div>
        {session.loggedIn && authToken ? (
          <>
            <p className="text-center">A membership card is waiting for you!</p>
            <div className="relative">
              <div className="mb-2 p-4">
                <div
                  className={`memberCardBorder relative h-[94px] w-[160px] grow`}
                >
                  <BaseSmallCard
                    isMember
                    memberName={session.session?.username}
                    content=""
                  />
                </div>
              </div>
              <div className="absolute -left-2 top-0">
                <WelcomeSparkle />
              </div>
            </div>
            <ButtonPrimary
              content="Join the Space"
              icon={<Member />}
              onClick={onClick}
            />
          </>
        ) : (
          <>
            <div className="display flex flex-row gap-2">
              <ButtonPrimary
                content="Log In"
                onClick={() => setState("login")}
                className="justify-self-center"
              />
              <p className="self-center text-sm italic">or</p>
              <ButtonSecondary
                content="Sign Up"
                onClick={() => setState("signup")}
                className="justify-self-center"
              />
            </div>
            <LogInModal
              isOpen={state === "login"}
              onClose={() => setState("normal")}
            />
            <SignupModal
              redirectTo={`/s/${router.query.studio}/s/${router.query.space}/${data?.display_name}/join?code=${router.query.code}`}
              isOpen={state === "signup"}
              onClose={() => setState("normal")}
            />
          </>
        )}
        <div className="flex max-w-sm flex-col gap-4 pt-4 text-center italic">
          <Divider />
          <p>
            <sup className="text-grey-55">†</sup>
            <strong>Spaces</strong>, on Hyperlink, are collaborative workspaces
            for doing projects together.
          </p>
          <p className="text-center">
            We&apos;re still in beta! Email if you have any questions:{" "}
            <a
              href="mailto:contact@hyperlink.academy"
              className="text-accent-blue"
            >
              contact@hyperlink.academy
            </a>{" "}
          </p>
        </div>
      </div>
    </>
  );
}

export const WelcomeSparkle = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="214"
      height="131"
      viewBox="0 0 214 131"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M175.414 5.64773C175.736 5.31814 177.096 3.91011 177.096 1.67583C177.096 -0.558459 179.16 -0.558362 179.16 1.67583C179.16 3.91002 180.184 5.28748 180.535 5.64773L180.566 5.67962C180.946 6.07007 181.983 7.13707 183.684 7.13723C185.433 7.1374 185.444 9.12336 183.684 9.12326C181.984 9.12315 181.201 9.92794 180.599 10.5474L180.535 10.6128C179.924 11.2393 179.167 12.1669 179.167 14.3454C179.167 16.5238 177.103 16.5795 177.103 14.3454C177.103 12.1113 175.811 10.7633 175.664 10.6128C175.517 10.4622 173.998 9.12326 172.281 9.12326C170.564 9.12326 170.581 7.13723 172.281 7.13723C173.961 7.13723 175.066 6.00439 175.402 5.65968L175.414 5.64773ZM18.4139 120.648C18.7356 120.318 20.0961 118.91 20.0961 116.676C20.0961 114.442 22.1596 114.442 22.1596 116.676C22.1595 118.91 23.1837 120.287 23.5352 120.648L23.5663 120.68C23.9458 121.07 24.9828 122.137 26.6837 122.137C28.4332 122.137 28.444 124.123 26.6837 124.123C24.9838 124.123 24.2012 124.928 23.5989 125.547L23.5352 125.613C22.9238 126.239 22.1665 127.167 22.1665 129.345C22.1665 131.524 20.103 131.579 20.103 129.345C20.103 127.111 18.8108 125.763 18.6639 125.613C18.517 125.462 16.9978 124.123 15.2811 124.123C13.5644 124.123 13.5811 122.137 15.2812 122.137C16.9613 122.137 18.0661 121.004 18.4023 120.66L18.4139 120.648ZM197.063 24.5611C197.063 29.309 194.148 32.301 193.458 33.0014L193.433 33.0268C192.713 33.7592 190.346 36.1666 186.745 36.1666C183.102 36.1666 183.067 40.3869 186.745 40.3869C190.424 40.3869 193.679 43.2322 193.994 43.5521C194.309 43.872 197.078 46.7365 197.078 51.4839C197.078 56.2314 201.5 56.1132 201.5 51.4839C201.5 46.8547 203.122 44.8835 204.433 43.5521L204.569 43.4132C205.86 42.0969 207.537 40.3867 211.179 40.3869C214.951 40.3872 214.928 36.167 211.179 36.1666C207.535 36.1663 205.312 33.8988 204.499 33.0692L204.433 33.0014C203.679 32.2359 201.485 29.3088 201.485 24.5611C201.485 19.8135 197.063 19.8133 197.063 24.5611ZM182.981 99.1783C183.854 98.2925 187.546 94.5084 187.546 88.5038C187.546 82.4991 193.147 82.4994 193.147 88.5038C193.147 94.5082 195.927 98.2101 196.881 99.1783L196.966 99.2639C197.996 100.313 200.811 103.181 205.427 103.181C210.176 103.182 210.205 108.519 205.427 108.519C200.813 108.518 198.689 110.681 197.054 112.346C196.996 112.405 196.938 112.464 196.881 112.522C195.222 114.206 193.166 116.699 193.166 122.553C193.166 128.408 187.565 128.557 187.565 122.553C187.565 116.549 184.058 112.926 183.659 112.522C183.26 112.117 179.137 108.519 174.477 108.519C169.818 108.519 169.863 103.181 174.478 103.181C179.038 103.181 182.037 100.137 182.949 99.2103L182.981 99.1783ZM10.4504 6.82796C10.4504 10.5983 8.11811 12.9744 7.5667 13.5306C7.56024 13.5371 7.55359 13.5438 7.54676 13.5507C6.97052 14.1323 5.07657 16.0441 2.19633 16.0441C-0.718045 16.0441 -0.746703 19.3955 2.19623 19.3955C5.13916 19.3955 7.7434 21.655 7.99526 21.909C8.24711 22.1631 10.4623 24.4378 10.4623 28.2078C10.4623 31.9778 13.9998 31.884 13.9998 28.2078C13.9998 24.5316 15.2979 22.9663 16.3461 21.909C16.3821 21.8727 16.4185 21.8359 16.4552 21.7988C17.4878 20.7534 18.8293 19.3953 21.7434 19.3955C24.7611 19.3957 24.7427 16.0444 21.7434 16.0441C18.8277 16.0438 17.0498 14.2432 16.3993 13.5843C16.3806 13.5654 16.3629 13.5475 16.3461 13.5306C15.7434 12.9226 13.9878 10.5982 13.9878 6.82796C13.9879 3.05776 10.4504 3.0576 10.4504 6.82796Z"
        fill="#FFD700"
      />
    </svg>
  );
};
