import { LoginForm } from "pages/login";
import { SignupForm } from "pages/signup";
import { Modal } from "./Layout";

export const LogInModal = (props: { isOpen: boolean; onClose: () => void }) => {
  return (
    <Modal open={props.isOpen} onClose={props.onClose}>
      <LoginForm onLogin={() => {}} />
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
      <SignupForm redirectTo={props.redirectTo} />
    </Modal>
  );
};
