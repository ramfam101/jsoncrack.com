import React from "react";
import dynamic from "next/dynamic";
import * as ModalComponents from ".";
import { useModal } from "../../store/useModal";
import { modals, type ModalName } from "./modalTypes";

// Dynamically import NodeModal to prevent SSR hydration issues
const NodeModal = dynamic(() => import("./NodeModal").then(mod => ({ default: mod.NodeModal })), {
  ssr: false,
});

const Modal = ({ modalKey }: { modalKey: ModalName }) => {
  const opened = useModal(state => state[modalKey]);
  const setVisible = useModal(state => state.setVisible);

  // Use dynamic import for NodeModal to prevent hydration errors
  if (modalKey === "NodeModal") {
    return <NodeModal opened={opened} onClose={() => setVisible(modalKey, false)} />;
  }

  const ModalComponent = ModalComponents[modalKey];
  return <ModalComponent opened={opened} onClose={() => setVisible(modalKey, false)} />;
};

const ModalController = () => {
  return modals.map(modal => <Modal key={modal} modalKey={modal} />);
};

export default ModalController;
