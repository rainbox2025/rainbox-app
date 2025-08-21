"use client";

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useBookmarks } from '@/context/bookmarkContext';

interface NotesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  mailId: string;
  onNoteClick: (bookmarkId: string) => void;
}

const NotesSidebar: React.FC<NotesSidebarProps> = ({ isOpen, onClose, mailId, onNoteClick }) => {
  const { bookmarks } = useBookmarks();

  const sortedNotesForMail = useMemo(() => {
    const notes = bookmarks.filter(b => b.mailId === mailId && b.isConfirmed);

    const comparePaths = (pathA: number[], pathB: number[]): number => {
      const len = Math.min(pathA.length, pathB.length);
      for (let i = 0; i < len; i++) {
        if (pathA[i] !== pathB[i]) {
          return pathA[i] - pathB[i];
        }
      }
      return pathA.length - pathB.length;
    };

    return notes.sort((a, b) => {
      if (!a.serializedRange || !b.serializedRange) return 0;
      const pathComparison = comparePaths(a.serializedRange.start.path, b.serializedRange.start.path);
      if (pathComparison !== 0) {
        return pathComparison;
      }
      return a.serializedRange.start.offset - b.serializedRange.start.offset;
    });
  }, [bookmarks, mailId]);


  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-[35px] right-5 h-[calc(100%-3rem)] w-[80vw] md:w-[320px] max-w-full bg-content border-l border-border z-[110] shadow-lg flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-sm border-b border-border flex-shrink-0">
              <h2 className="font-semibold text-base truncate">Notes</h2>
              <button
                onClick={onClose}
                className="p-xs rounded-full hover:bg-muted"
                title="Close Notes"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-sm space-y-sm pr-0">
                {sortedNotesForMail.length > 0 ? (
                  sortedNotesForMail.map((note, index) => (
                    <React.Fragment key={note.id}>
                      <div
                        className="cursor-pointer hover:bg-muted/50 p-sm rounded-lg transition-colors"
                        onClick={() => onNoteClick(note.id)}
                        title="Click to scroll to highlight"
                      >
                        <blockquote className="border-l-4 border-yellow-400 p-2 bg-yellow-400/10 rounded-r-md mb-2">
                          <p className="text-sm text-foreground break-words" style={{ whiteSpace: 'pre-wrap' }}>
                            {note.text}
                          </p>
                        </blockquote>
                        {note.comment && (
                          <p className="text-sm text-muted-foreground italic my-2 pl-1 break-words">
                            “{note.comment}”
                          </p>
                        )}
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {note.tags.map(tag => (
                              <div key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full break-all">
                                #{tag}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {index < sortedNotesForMail.length - 1 &&
                        <div className='border-b border-border my-1'></div>
                      }
                    </React.Fragment>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-4 px-4">
                    <p className="font-medium">No notes for this mail.</p>
                    <p className="text-xs mt-2">Highlight text in the mail to create a new note.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotesSidebar;