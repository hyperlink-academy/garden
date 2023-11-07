import { LoginForm } from "pages/login";
import { SignupForm } from "pages/signup";
import { Modal } from "./Modal";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

export const LogInModal = (props: {
  isOpen: boolean;
  onClose: () => void;
  redirectOnLogin?: (s: { username?: string }) => void;
  onSwitchToSignUp?: () => void;
}) => {
  return (
    <Modal open={props.isOpen} onClose={props.onClose}>
      <LoginForm
        onLogin={(s) => {
          if (props.redirectOnLogin) {
            props.redirectOnLogin(s);
          }
        }}
        onClose={props.onClose}
        onSwitchToSignUp={props.onSwitchToSignUp}
      />
    </Modal>
  );
};

export const SignupModal = (props: {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
  onSwitchToLogIn?: () => void;
}) => {
  return (
    <Modal open={props.isOpen} onClose={props.onClose}>
      <SignupForm
        redirectTo={props.redirectTo}
        onClose={props.onClose}
        onSwitchToLogIn={props.onSwitchToLogIn}
      />
    </Modal>
  );
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
      <button
        className={buttonClass}
        onClick={() => supabase.auth.signInWithOAuth({ provider: "apple" })}
      >
        <img src="/sso/apple.svg" width={24} alt="apple" />
        <p>{props.actionLabel} with Apple</p>
      </button>
    </div>
  );
};
