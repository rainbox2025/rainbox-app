"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OutlookRainboxLogosDisplay } from './outlook-rainbox-logo';
import { ModalCloseButton } from '../modals/modal-close-button';
import { Button } from '../ui/button';
import {
  ArrowDownTrayIcon,
  StarIcon,
  ArchiveBoxIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';


type FeatureIconType = "ArrowDownTrayIcon" | "StarIcon" | "ArchiveBoxIcon" | "ShieldCheckIcon" | "DefaultIcon";

interface FeatureItemProps {
  icon: FeatureIconType;
  title: string;
  description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description }) => {
  let IconComponent;
  switch (icon) {
    case "ArrowDownTrayIcon": IconComponent = ArrowDownTrayIcon; break;
    case "StarIcon": IconComponent = StarIcon; break;
    case "ArchiveBoxIcon": IconComponent = ArchiveBoxIcon; break;
    case "ShieldCheckIcon": IconComponent = ShieldCheckIcon; break;
    default: IconComponent = QuestionMarkCircleIcon;
  }
  return (
    <div className="flex items-start space-x-3">
      <IconComponent className="h-10 w-10 mr-1 text-muted-foreground" strokeWidth={2} />
      <div>
        <h3 className="text-sm font-semibold ">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

interface ConnectOutlookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToPermissions: () => void;
}

export const ConnectOutlookModal: React.FC<ConnectOutlookModalProps> = ({
  isOpen,
  onClose,
  onProceedToPermissions,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-content rounded-xl shadow-xl w-full max-w-[400px] border border-secondary"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold 00">
                  Connect your <span className="text-blue-600">Outlook</span>
                </h2>
                <ModalCloseButton onClick={onClose} />
              </div>

              <OutlookRainboxLogosDisplay />

              <div className="space-y-4 my-6">
                <FeatureItem
                  icon="ArrowDownTrayIcon"
                  title="Import your newsletters in seconds"
                  description="Bring all your existing newsletters from Outlook to Rainbox. Simply, sign in and select the sender"
                />
                <FeatureItem
                  icon="StarIcon"
                  title="Never miss your favorite newsletters"
                  description="Get every new issue from your favorite newsletters delivered straight to your Rainbox—never miss a read again."
                />
                <FeatureItem
                  icon="ShieldCheckIcon"
                  title="Your privacy, fully protected"
                  description="Rainbox accesses only the newsletters you choose. We never access or share your data, ever."
                />
              </div>

              <Button className="w-full text-sm" onClick={onProceedToPermissions}>
                Connect with Outlook
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};