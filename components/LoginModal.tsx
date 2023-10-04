import { LoginForm } from "pages/login";
import { SignupForm } from "pages/signup";
import { Modal } from "./Modal";

export const LogInModal = (props: {
  isOpen: boolean;
  onClose: () => void;
  redirectOnLogin?: (s: { username?: string }) => void;
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
      />
    </Modal>
  );
};

export const SignupModal = (props: {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
}) => {
  return (
    <Modal open={props.isOpen} onClose={props.onClose}>
      <SignupForm redirectTo={props.redirectTo} onClose={props.onClose} />
    </Modal>
  );
};
