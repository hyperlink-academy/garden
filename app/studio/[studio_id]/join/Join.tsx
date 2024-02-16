"use client";
import { spaceAPI } from "backend/lib/api";
import { StudioData } from "backend/routes/get_studio_data";
import {
  ButtonPrimary,
  ButtonSecondary,
  ButtonTertiary,
} from "components/Buttons";
import { Email, GoToPageLined, Member } from "components/Icons";
import { LoginOrSignupModal, OAuth } from "components/LoginModal";
import { Textarea } from "components/Textarea";
import { useAuth } from "hooks/useAuth";
import Head from "next/head";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { WORKER_URL } from "src/constants";
import { uuidToBase62 } from "src/uuidHelpers";
import { MemberCard } from "../MemberTab";
import { DotLoader } from "components/DotLoader";
import { Divider } from "components/Layout";

export function JoinStudio(props: { data: StudioData }) {
  let { push } = useRouter();
  let query = useSearchParams();
  let code = query?.get("code");
  let { session, authToken } = useAuth();
  let [bio, setBio] = useState("");
  let [state, setState] = useState<"loading" | "normal">("normal");
  let [logInModalState, setLogInModalState] =
    LoginOrSignupModal.useState("closed");

  const onClick = async () => {
    console.log(!props.data, !authToken, !code);
    if (!props.data || !authToken || !code) return;
    setState("loading");
    let data = await spaceAPI(
      `${WORKER_URL}/space/${props.data?.do_id}`,
      "join",
      {
        authToken,
        code,
        bio,
      }
    );

    if (data.success) {
      push(`/studio/${uuidToBase62(props.data.id)}`);
    }
    setState("normal");
  };

  let data = props.data;

  return (
    <>
      <Head>
        <title key="title">{data?.name}: you&apos;re invited!</title>
      </Head>

      <div className="mx-auto flex max-w-3xl flex-col place-items-center gap-6 px-4 py-8">
        <YoureInvited />
        {/* <h2>
          You&apos;ve Been Invited to a{" "}
          <em>
            Studio<sup className="text-grey-55">†</sup>
          // </em>
        </h2> */}
        <div className="flex flex-col gap-1">
          <h2>{data?.name}</h2>

          <Link
            className="text-accent-blue flex items-center justify-center gap-1 hover:underline"
            href={`/studio/${uuidToBase62(props.data.id || "")}`}
          >
            See the studio <GoToPageLined />
          </Link>
        </div>
        {data?.welcome_message && (
          <div className="border-grey-80 max-w-2xl rounded-md border bg-white p-2">
            <Textarea previewOnly value={data?.welcome_message} />
          </div>
        )}

        {session.session ? (
          !session.session.username ? (
            <Link
              href={`/setup?redirectTo=${encodeURIComponent(
                window.location.pathname + `?code=${code}`
              )}`}
            >
              <ButtonPrimary content="Finish setting up your account!" />
            </Link>
          ) : (
            <>
              <div className="flex w-full flex-col gap-2">
                <p className="text-center text-lg font-bold ">
                  Introduce yourself! <br />
                  Let other&apos;s know what you&apos;re up to.
                </p>
                <div className="relative">
                  <div className="mx-auto mb-2  w-[448px] max-w-full">
                    <div className={`relative grow`}>
                      <MemberCard
                        spaces={[]}
                        bio={bio}
                        onBioChange={setBio}
                        memberStudio={session.session?.studio || ""}
                        memberName={session.session.username}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <ButtonPrimary
                content={
                  state === "loading" ? <DotLoader /> : "Join the Studio"
                }
                icon={<Member />}
                onClick={onClick}
              />
            </>
          )
        ) : (
          <div className="flex flex-col place-items-center gap-3">
            <h4>Log In to Hyperlink to Join!</h4>
            <div className="flex flex-col items-center gap-2">
              <OAuth actionLabel="Sign Up" />

              <ButtonPrimary
                content="Sign Up with Email"
                icon={<Email />}
                onClick={() => setLogInModalState("signup")}
                className="justify-self-center"
              />
            </div>

            <div className="text-grey-55 flex w-full items-center gap-2 italic ">
              <Divider /> or <Divider />
            </div>
            <ButtonSecondary
              content="Log In"
              onClick={() => setLogInModalState("login")}
              className="justify-self-center"
            />
            <LoginOrSignupModal
              state={logInModalState}
              setState={setLogInModalState}
              redirectTo={`/studio/${uuidToBase62(
                props.data.id || ""
              )}/join?code=${code}`}
            />
          </div>
        )}
      </div>
    </>
  );
}

const LoginOrSignup = (props: {
  id: string | undefined;
  code: string | null | undefined;
}) => {
  let [logInModalState, setLogInModalState] =
    LoginOrSignupModal.useState("closed");
  return (
    <>
      <div className="display flex flex-row gap-2">
        <ButtonPrimary
          content="Log In"
          onClick={() => setLogInModalState("login")}
          className="justify-self-center"
        />
        <p className="self-center text-sm italic">or</p>
        <ButtonSecondary
          content="Sign Up"
          onClick={() => setLogInModalState("signup")}
          className="justify-self-center"
        />
      </div>
      <LoginOrSignupModal
        state={logInModalState}
        setState={setLogInModalState}
        redirectTo={`/studio/${uuidToBase62(props.id || "")}/join?code=${
          props.code
        }`}
      />
    </>
  );
};

export const YoureInvited = () => {
  return (
    <svg
      width="221"
      height="152"
      viewBox="0 0 221 152"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M116.156 0.44721L112.559 0.310425L111.923 17.0503L115.52 17.1871L116.156 0.44721ZM72.3444 25.0943L66.4692 9.40637L76.4933 5.65233L77.5287 8.41683L70.8759 10.9083L72.2226 14.5044L78.6506 12.0971L79.686 14.8616L73.2579 17.2689L74.6804 21.0673L81.3332 18.5758L82.3685 21.3403L72.3444 25.0943ZM54.7058 35.4304L57.6856 33.4972L54.3025 28.2825L55.6918 27.3812L61.4306 31.0676L64.7325 28.9254L58.3298 25.0975C58.969 24.3777 59.2726 23.5227 59.2406 22.5327C59.2133 21.5205 58.8775 20.5178 58.2331 19.5245C57.3361 18.1419 56.2549 17.2985 54.9895 16.9942C53.7153 16.6765 52.3937 16.9618 51.0246 17.85L45.5884 21.3768L54.7058 35.4304ZM55.7274 23.4673C55.6197 23.9187 55.2168 24.3707 54.5188 24.8236L52.7873 25.9469L50.1487 21.8798L51.8803 20.7565C52.5782 20.3037 53.1553 20.12 53.6113 20.2056C54.0673 20.2912 54.4956 20.6427 54.8962 21.2602L55.2881 21.8642C55.6887 22.4816 55.8351 23.016 55.7274 23.4673ZM30.0374 33.8656L33.2383 30.6178L36.486 38.4688L34.6497 40.332L30.0374 33.8656ZM24.6499 60.1127L15.6676 54.4694L13.7524 57.5177L22.3283 62.9057C23.7102 63.7739 24.9063 64.3364 25.9165 64.5932C26.9132 64.8414 27.8538 64.7427 28.7385 64.297C29.6096 63.8429 30.4665 62.9452 31.3092 61.6039C32.1518 60.2626 32.5888 59.1011 32.6199 58.1191C32.6375 57.1287 32.3182 56.2384 31.662 55.4482C30.9922 54.6495 29.9664 53.8161 28.5845 52.9479L20.0086 47.5599L18.0935 50.6082L27.0758 56.2515C27.7803 56.6942 28.3102 57.0838 28.6656 57.4204C29.021 57.7571 29.2312 58.1443 29.2963 58.582C29.3564 58.9976 29.2077 59.49 28.8502 60.059C28.4927 60.628 28.1094 60.9824 27.7004 61.1222C27.2863 61.24 26.8505 61.2118 26.393 61.0378C25.9354 60.8637 25.3544 60.5554 24.6499 60.1127ZM22.5815 79.872C21.8373 81.9508 20.5814 83.2516 18.8138 83.7744C17.0515 84.2822 14.8523 84.0642 12.2161 83.1205C9.57997 82.1768 7.74208 80.9495 6.70245 79.4387C5.66822 77.9128 5.5232 76.1105 6.2674 74.0317C7.01159 71.9529 8.26481 70.6596 10.0271 70.1518C11.7947 69.629 13.9966 69.8395 16.6328 70.7832C19.2689 71.7269 21.1041 72.9617 22.1384 74.4876C23.178 75.9984 23.3257 77.7932 22.5815 79.872ZM19.8474 78.8932C20.1764 77.9743 20.072 77.1977 19.5344 76.5634C18.9816 75.9237 18.0349 75.3638 16.6943 74.8839L13.9602 73.9051C12.6195 73.4251 11.5401 73.2597 10.722 73.4086C9.90396 73.5576 9.33044 74.0916 9.00148 75.0105C8.67253 75.9294 8.77688 76.706 9.31454 77.3403C9.8522 77.9746 10.7914 78.5318 12.1321 79.0117L14.8887 79.9986C16.2294 80.4785 17.3088 80.644 18.1269 80.495C18.945 80.346 19.5185 79.8121 19.8474 78.8932ZM17.482 101.341L11.6014 100.592L0.194336 104.487L0.700412 100.511L4.78154 99.2405L8.20687 98.3701L8.23111 98.1796L5.13307 96.4788L1.50044 94.2261L1.98833 90.393L12.056 97.0213L17.9365 97.7698L17.482 101.341ZM130.368 7.74781L130.111 7.69093L127.711 18.5654L124.711 17.9034L128.321 1.54492L132.539 2.47575L133.866 14.1724L134.124 14.2293L136.523 3.35486L139.523 4.01678L135.914 20.3753L131.695 19.4445L130.368 7.74781ZM150.31 7.375L147.288 24.4399L151.903 26.581L162.981 13.2529L159.519 11.6471L154.127 18.5377L151.182 22.4896L151.008 22.4088L152.145 17.6187L153.945 9.06163L150.31 7.375ZM172.382 19.0969L175.325 21.1696L165.68 34.8666L162.737 32.7939L172.382 19.0969ZM178.292 45.8376L188.121 36.1509L191.507 39.5867L193.609 37.5145L184.31 28.0789L182.208 30.151L185.594 33.5868L175.765 43.2736L178.292 45.8376ZM186.928 55.9247L201.113 47.0128L206.808 56.0764L204.308 57.6469L200.529 51.6316L197.277 53.6744L200.929 59.4865L198.429 61.0569L194.778 55.2448L191.343 57.4026L195.123 63.4179L192.623 64.9883L186.928 55.9247ZM214.419 72.707L212.599 67.6229L196.827 73.2691L198.647 78.3531C199.396 80.447 200.628 81.7737 202.34 82.3331C204.068 82.8872 206.213 82.7058 208.773 81.7891C211.334 80.8723 213.099 79.6543 214.068 78.1349C215.051 76.6101 215.168 74.8008 214.419 72.707ZM206.072 78.7286C203.541 79.6345 201.928 79.1159 201.232 77.1727L200.69 75.6588L211.13 71.9216L211.671 73.4355C212.367 75.3787 211.457 76.8007 208.941 77.7012L206.072 78.7286ZM209.312 97.0116L215.138 94.8909L219.971 94.2757L220.462 98.1326L215.629 98.7477L209.457 98.1543L209.312 97.0116ZM208.116 99.9703L203.878 100.51L203.317 96.1052L207.555 95.5658L208.116 99.9703ZM113.29 125.85L92.8752 83.7058C92.3936 82.7118 92.8091 81.5155 93.8032 81.034C94.7972 80.5524 95.9935 80.9679 96.475 81.962L116.996 124.324L141.886 113.037C142.892 112.581 144.077 113.026 144.533 114.032C144.989 115.038 144.544 116.224 143.538 116.68L116.872 128.772C115.884 129.22 114.719 128.799 114.246 127.822L113.291 125.851L113.111 125.779V125.778L113.29 125.85ZM89.7153 73.8006L89.7155 73.801L129.195 58.1997L135.894 71.2217L136.935 70.7424C137.637 70.4194 138.45 70.4444 139.13 70.8099L146.34 74.6809C147.14 75.1101 147.639 75.944 147.639 76.8513V94.0528L155.028 108.418L150.154 110.855V134.258L113.11 151.81V151.809L97.5139 144.496V130.095L82.1411 137.717L81.9167 137.279V137.67L67.2942 130.844V105.004L63.8823 103.541L89.7146 73.8014L89.7153 73.8006ZM81.9167 132.33V120.604C81.9167 114.753 84.2567 109.098 89.7153 111.829C94.3924 114.169 96.7067 119.775 97.3342 124.686L81.9167 132.33ZM127.483 75.5907C128.082 74.6627 129.32 74.396 130.248 74.995L136.226 78.8541C136.797 79.2225 137.141 79.8552 137.141 80.5344V100.277C137.141 101.382 136.246 102.277 135.141 102.277C134.037 102.277 133.141 101.382 133.141 100.277V81.6239L128.078 78.3557C127.15 77.7566 126.884 76.5187 127.483 75.5907Z"
        fill="currentColor"
      />
    </svg>
  );
};
export const WelcomeSparkle = () => {
  return (
    <svg
      width="214"
      height="131"
      viewBox="0 0 214 131"
      fill="none"
      className="pointer-events-none"
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
