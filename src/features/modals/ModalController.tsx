import React from "react";
import dynamic from "next/dynamic";
import * as ModalComponents from ".";
import { useModal } from "../../store/useModal";
import { modals, type ModalName } from "./modalTypes";

// Dynamically import UniqueNodeModal to prevent SSR hydration issues
const UniqueNodeModal = dynamic(() => import("./NodeModal").then(mod => ({ default: mod.UniqueNodeModal })), {
  ssr: false,
});

const UniqueModal = ({ modalKey }: { modalKey: ModalName }) => {
  const isOpen = useModal(store => store[modalKey]);
  const showModal = useModal(store => store.setVisible);

  if (modalKey === "NodeModal") {
    return <UniqueNodeModal opened={isOpen} onClose={() => showModal(modalKey, false)} />;
  }

  const ModalComponent = ModalComponents[modalKey];
  return <ModalComponent opened={isOpen} onClose={() => showModal(modalKey, false)} />;
};

const UniqueModalController = () => {
  return modals.map(modal => <UniqueModal key={modal} modalKey={modal} />);
};

export default UniqueModalController;