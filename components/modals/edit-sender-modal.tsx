import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowPathIcon, PlusIcon, XMarkIcon, PhotoIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useFolders } from '@/context/foldersContext';
import { useSenders } from '@/context/sendersContext';
import { SenderType } from '@/types/data';

interface EditSenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  sender: SenderType;
}

export const EditSenderModal: React.FC<EditSenderModalProps> = ({
  isOpen,
  onClose,
  sender,
}) => {
  const { folders, updateSenderInUI } = useFolders(); // Get the new UI update function
  const { updateSender } = useSenders();

  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState<string>(''); // State for folder_id
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && sender) {
      setTitle(sender.name);
      // Initialize with the sender's current folder_id, or an empty string for "No Folder"
      setFolderId(sender.folder_id || '');
      setIconPreview(sender.image_url || null);
      setIconFile(null);
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen, sender]);

  const handleConfirm = async () => {
    if (!sender) return;
    setIsLoading(true);
    try {
      const formData = new FormData();

      if (title !== sender.name) formData.append('name', title);
      if (iconFile) formData.append('image', iconFile);
      const originalFolderId = sender.folder_id || '';
      if (folderId !== originalFolderId) formData.append('folder_id', folderId);

      // Only make the API call if there's something to update
      if (Array.from(formData.keys()).length > 0) {
        // 1. Call API function, which returns the updated sender
        const updatedSender = await updateSender(sender.id, formData);

        // 2. Call the master UI update function with the original and new sender data
        updateSenderInUI(sender, updatedSender);
      }

      onClose();
    } catch (error) {
      console.error("Error updating sender:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setIconPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleIconClick = () => fileInputRef.current?.click();

  if (!isOpen || !sender) return null;

  const hasChanges = title !== sender.name || !!iconFile || folderId !== (sender.folder_id || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm w-[100vw]  !mt-0">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-content rounded-lg shadow-xl w-full max-w-sm mx-4 border border-border"
        >
          <div className="p-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold">Edit Feed</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-secondary-foreground" disabled={isLoading}>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-muted-foreground mb-1">Source</label>
              <p className="text-sm text-muted-foreground">{sender.domain}</p>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-muted-foreground mb-1">Feed Icon and Title</label>
              <div className="flex items-center space-x-2">
                <div
                  className="relative w-12 h-12 border border-border rounded-full flex items-center justify-center overflow-hidden bg-accent"
                  onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)} onClick={handleIconClick}
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
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleIconChange} disabled={isLoading} />
                </div>
                <input ref={titleInputRef} type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Feed Title" className="flex-1 p-sm border border-border rounded-md bg-content focus:outline-none focus:ring-2 focus:ring-ring text-sm" disabled={isLoading} />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-muted-foreground mb-1">Folder</label>
              <div className="relative">
                <select
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  className="w-full p-sm border border-border rounded-md bg-content appearance-none focus:outline-none focus:ring-2 focus:ring-ring text-sm cursor-pointer"
                  disabled={isLoading}
                >
                  {/* Use empty string for "No Folder" value */}
                  <option value="">No Folder</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button onClick={onClose} className="px-4 py-2 text-muted-foreground hover:bg-accent rounded-md transition-colors text-sm" disabled={isLoading}>
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/80 rounded-md transition-colors text-sm relative min-w-[60px] flex justify-center items-center"
                disabled={isLoading || !hasChanges}
              >
                {isLoading ? <ArrowPathIcon className="animate-spin h-4 w-4" /> : "Done"}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};