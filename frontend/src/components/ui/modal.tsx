import { ReactNode, useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
  showCloseButton = true,
}: ModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setIsClosing(false);
    } else {
      setIsClosing(true);
      // Delay the actual close to allow animation to complete
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setIsClosing(false);
      }, 300); // Match the animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    // Delay the actual close to allow animation to complete
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isOpen && !isAnimating) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-gray-900/50 ${
          isClosing ? "animate-fade-slide-out" : "animate-fade-slide-in"
        }`}
        onClick={handleClose}
      />

      {/* Modal content */}
      <div
        className={`relative z-10 bg-white rounded-xl shadow-xl ${
          maxWidthClasses[maxWidth]
        } w-full ${isClosing ? "animate-bounce-out" : "animate-bounce-in"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {showCloseButton && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
