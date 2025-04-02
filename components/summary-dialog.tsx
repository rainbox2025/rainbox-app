import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Summary</DialogTitle>
          <DialogDescription>
            {summarizeLoading ? (
              <div className="flex flex-col gap-2 mt-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : summarizeError ? (
              <div className="text-red-500">{summarizeError}</div>
            ) : (
              <div className="text-sm mt-md">{summary}</div>
            )}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default SummaryDialog;
