import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import React from 'react'

export default function DisconnectBox({ showDisconnectOutlook, handleCloseModal }: { showDisconnectOutlook: boolean, handleCloseModal: () => void }) {
  return (
    <div>
      {showDisconnectOutlook && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm w-[100vw]">
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-content  rounded-lg shadow-xl w-full max-w-sm mx-4 border border-gray-100/80"
            >
              <div className="p-md">
                <div className="flex justify-between items-start mb-4">
                  <div className='flex flex-col gap-1'>
                    <h2 className="text-sm font-semibold">Are you sure you want to disconnect Outlook?</h2>
                    <p className="mb-2 text-xs text-muted-foreground">You'll not receive any future emails from Outlook.</p>
                  </div>


                  <button
                    onClick={handleCloseModal}
                    className="text-muted-foreground hover:text-secondary-foreground"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>


                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-muted-foreground hover:bg-accent rounded-md transition-colors text-sm"
                  >
                    Go back
                  </button>
                  <button

                    onClick={() => { }}
                    className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/80 rounded-md transition-colors text-sm relative"
                  >
                    <span className="text-sm ">Disconnect</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
