import { LoginForm } from "pages/login";
import { SignupForm } from "pages/signup";
import { Modal } from "./Modal";

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
