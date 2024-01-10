import { LoginForm } from "pages/login";
import { SignupForm } from "pages/signup";
import { Modal } from "./Modal";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useState } from "react";

export const LoginOrSignupModal = (props: {
  state: "login" | "signup" | "closed";
  setState: (s: "login" | "signup" | "closed") => void;
  redirectOnLogin?: (s: { username?: string }) => void;
  redirectTo?: string;
}) => {
  return (
    <Modal
      open={props.state !== "closed"}
      onClose={() => props.setState("closed")}
      noCloseButton
    >
      {props.state === "login" ? (
        <LoginForm
          onLogin={(s) => {
            if (props.redirectOnLogin) {
              props.redirectOnLogin(s);
            }
          }}
          onClose={() => props.setState("closed")}
          onSwitchToSignUp={() => props.setState("signup")}
        />
      ) : (
        <SignupForm
          redirectTo={props.redirectTo}
          onClose={() => props.setState("closed")}
          onSwitchToLogIn={() => props.setState("login")}
        />
      )}
    </Modal>
  );
};

LoginOrSignupModal.useState = (initialState: "login" | "signup" | "closed") => {
  return useState(initialState);
};

const buttonClass =
  "lightBorder flex w-full items-center  justify-center gap-4 py-2 hover:border-accent-blue hover:bg-bg-blue";
export const OAuth = (props: { actionLabel: string }) => {
  let supabase = useSupabaseClient();
  return (
    <div className="LogInSSO flex flex-col gap-2 font-bold text-grey-35">
      <button
        className={buttonClass}
        onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}
      >
        <img src="/sso/google.svg" width={24} alt="google" />
        <p>{props.actionLabel} with Google</p>
      </button>
      {/* <button
        className={buttonClass}
        onClick={() => supabase.auth.signInWithOAuth({ provider: "apple" })}
      >
        <img src="/sso/apple.svg" width={24} alt="apple" />
        <p>{props.actionLabel} with Apple</p>
      </button> */}
    </div>
  );
};
