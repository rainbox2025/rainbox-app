import { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";
import { useMails } from "@/context/mailsContext";
import { X } from "lucide-react";
import { SparklesIcon } from "@heroicons/react/24/outline";

const SummaryDialog = ({
  open,
  onOpenChange,
  containerRef
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  containerRef: any;
}) => {
  const { summarize, summarizeLoading, selectedMail, summarizeError } = useMails();
  const [summary, setSummary] = useState<string | null>(null);
  const [dialogStyle, setDialogStyle] = useState({});

  useEffect(() => {
    const summarizeMail = async () => {
      if (selectedMail?.id) {
        const summary = await summarize(selectedMail?.id);
        setSummary(summary);
      }
    };
    summarizeMail();
  }, [open, selectedMail?.id]);


  useEffect(() => {
    const updatePosition = () => {
      if (!containerRef?.current) return;

      // Get container width for proper sizing
      const containerWidth = containerRef.current.getBoundingClientRect().width;

      setDialogStyle({
        position: 'fixed',
        bottom: '0',
        left: containerRef.current.getBoundingClientRect().left,
        width: `${containerWidth}px`,
        zIndex: 30
      });
    };

    // Initial position calculation
    updatePosition();

    // Only update on resize, not on scroll
    window.addEventListener('resize', updatePosition);

    // Create a ResizeObserver to detect container width changes
    const resizeObserver = new ResizeObserver(updatePosition);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updatePosition);
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  if (!open) return null;

  return (
    <div
      className="bg-sidebar/1 pb-8 backdrop-blur-3xl border-t border-gray-200 dark:border-gray-800 shadow-lg animate-in slide-in-from-bottom duration-300"
      style={{
        ...dialogStyle,
        borderRadius: '8px 8px 0 0',
      }}
    >
      {/* Rest of your dialog content remains the same */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">

          <div className='flex items-center gap-1'>
            <h2 className="text-sm font-semibold">AI Summary </h2>
            <SparklesIcon className="h-4 w-4" />
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="text-sm hover:text-secondary-foreground p-1 rounded-full hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 overflow-y-auto max-h-[200px]">
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
      </div>
    </div>
  );
};

export default SummaryDialog;