import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  className?: string; // For custom styling, e.g., text color for destructive actions
  disabled?: boolean;
}

interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: DropdownItem[];
  positionClasses?: string; // e.g., "absolute right-0 top-full mt-1"
  menuRef?: React.RefObject<HTMLDivElement>;
  widthClass?: string; // e.g., "w-48"
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  isOpen,
  onClose,
  items,
  positionClasses = "absolute right-0 top-full mt-1 z-20",
  menuRef: externalMenuRef,
  widthClass = "w-48", // Default width similar to SenderDropdownMenu
}) => {
  const internalMenuRef = useRef<HTMLDivElement>(null);
  const menuRef = externalMenuRef || internalMenuRef;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, menuRef]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: -5, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -5, scale: 0.95 }}
          transition={{ duration: 0.1 }}
          className={`${positionClasses} ${widthClass} bg-content z-50 text-popover-foreground rounded-md shadow-lg py-1 border border-border`}
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={(e) => {
                if (item.disabled) return;
                item.onClick(e);
                // onClose(); // Typically, the onClick handler or parent component decides to close
              }}
              disabled={item.disabled}
              className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-secondary transition-all duration-150 ease-in-out hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${item.className || ''}`}
            >
              {item.icon && <span className="flex-shrink-0 w-4 h-4">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};