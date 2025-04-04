import React, { useEffect, useState } from "react";
import { useMails } from "@/context/mailsContext";
import { Skeleton } from "./ui/skeleton";

const SummaryDialog = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { summarize, summarizeLoading, selectedMail, summarizeError } =
    useMails();
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    const summarizeMail = async () => {
      if (selectedMail?.id) {
        const summary = await summarize(selectedMail?.id);
        setSummary(summary);
      }
    };
    summarizeMail();
  }, [open, selectedMail?.id]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card dark:bg-card rounded-lg shadow-xl w-full max-w-sm mx-4 border border-gray-100/80">
        <div className="p-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold">Summary</h2>
            <button
              onClick={() => onOpenChange(false)}
              className="text-sm hover:text-secondary-foreground"
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

          <div className="mt-2">
            {summarizeLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : summarizeError ? (
              <div className="text-red-500">{summarizeError}</div>
            ) : (
              <div className="text-sm">{summary}</div>
            )}
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-muted-foreground hover:bg-accent rounded-md transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryDialog;