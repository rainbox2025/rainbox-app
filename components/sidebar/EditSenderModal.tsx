import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowPathIcon, PlusIcon, XMarkIcon, PhotoIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useFolders } from '@/context/foldersContext';

interface EditSenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: string) => Promise<void> | void;
  initialValues?: {
    source: string;
    title: string;
    folder: string;
  };
}

export const EditSenderModal: React.FC<EditSenderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialValues = { source: '', title: '', folder: 'No Folder' }
}) => {
  const { folders } = useFolders()
  const [isLoading, setIsLoading] = React.useState(false);
  const [source, setSource] = useState(initialValues.source);
  const [title, setTitle] = useState(initialValues.title);
  const [folder, setFolder] = useState(initialValues.folder);
  const [icon, setIcon] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sourceInputRef = useRef<HTMLInputElement>(null);

  const handleConfirm = async (title: string) => {
    setIsLoading(true);
    try {
      await onSave(title);
      onClose();
    } catch (error) {
      console.error("Error confirming action:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSource(initialValues.source);
      setTitle(initialValues.title);
      setFolder(initialValues.folder);
      setIcon(null);
      setIconPreview(null);
      setTimeout(() => sourceInputRef.current?.focus(), 100);
    }
  }, [isOpen, initialValues]);

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setIcon(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIconClick = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card dark:bg-card rounded-lg shadow-xl w-full max-w-sm mx-4 border border-gray-100/80"
        >
          <div className="p-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold">Edit Feed</h2>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-secondary-foreground"
                disabled={isLoading}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Source Input */}
            <div className="mb-4 flex gap-2">
              <label className="block text-xs text-muted-foreground ">Source</label>
              <p className="text-sm border-b border-black">{source}</p>

            </div>

            {/* Feed Icon and Title */}
            <div className="mb-4">
              <label className="block text-xs text-muted-foreground mb-1">Feed Icon and Title</label>
              <div className="flex items-center space-x-2">
                <div
                  className="relative w-12 h-12 border border-border rounded-full flex items-center justify-center overflow-hidden"
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                  onClick={handleIconClick}
                >
                  {iconPreview ? (
                    <img src={iconPreview} alt="Icon preview" className="w-full h-full object-cover" />
                  ) : (
                    <PhotoIcon className="w-6 h-6 text-muted-foreground" />
                  )}
                  {isHovering && (
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center cursor-pointer">
                      <PlusIcon className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleIconChange}
                    disabled={isLoading}
                  />
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Feed Title"
                  className="flex-1 p-sm border border-border dark:border-border rounded-md 
                             bg-content dark:bg-content 
                             focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Folder Selection */}
            <div className="mb-4">
              <label className="block text-xs text-muted-foreground mb-1">Folder</label>
              <div className="relative">
                <select
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className="w-full p-sm border border-border dark:border-border rounded-md 
                             bg-content dark:bg-content appearance-none
                             focus:outline-none focus:ring-2 focus:ring-ring text-sm  cursor-pointer"
                  disabled={isLoading}
                >
                  <option value="No Folder">No Folder</option>
                  {
                    folders.map((folder) => (
                      <option key={folder.id} value={folder.name}>{folder.name}</option>
                    ))
                  }
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-muted-foreground hover:bg-accent rounded-md transition-colors text-sm"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirm(title)}
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/80 rounded-md transition-colors text-sm relative"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="opacity-0">Edit Feed</span>
                    <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <ArrowPathIcon className="animate-spin h-4 w-4 text-sm" />
                    </span>
                  </>
                ) : "Edit Feed"}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};