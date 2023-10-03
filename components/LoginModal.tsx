import { LoginForm } from "pages/login";
import { SignupForm } from "pages/signup";
import { ModalNew } from "./Modal";
import { Modal } from "./Layout";

export const LogInModal = (props: {
  isOpen: boolean;
  onClose: () => void;
  onLogin?: (s) => void;
}) => {
  return (
    <ModalNew open={props.isOpen} onClose={props.onClose}>
      <LoginForm
        onLogin={() => {
          if (props.onLogin) {
            props.onLogin(s);
          }
        }}
        onClose={props.onClose}
      />
    </ModalNew>
  );
};

export const SignupModal = (props: {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
}) => {
  return (
    <ModalNew open={props.isOpen} onClose={props.onClose}>
      <SignupForm redirectTo={props.redirectTo} onClose={props.onClose} />
    </ModalNew>
  );
};
