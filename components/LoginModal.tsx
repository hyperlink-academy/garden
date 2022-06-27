import { LoginForm } from "pages/login";
import { Modal } from "./Layout";

export const LogInModal = (props: { isOpen: boolean; onClose: () => void }) => {
  return (
    <Modal open={props.isOpen} onClose={props.onClose}>
      <LoginForm onLogin={() => {}} />
    </Modal>
  );
};
