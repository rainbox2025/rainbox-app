import { useState } from "react";
import Image from "next/image";
import { ArrowRightIcon, ClipboardIcon, PlusIcon, XMarkIcon, ArrowPathIcon } from "@heroicons/react/24/outline"; // Added ArrowPathIcon

type ConnectionCardProps = {
  logo: string;
  logoAlt: string;
  title: string;
  subtitle?: string | null;
  actionType?: string;
  onAction?: () => void;
  // This prop seems unused in the original button text logic, but kept for API consistency.
  // The button text logic currently uses hardcoded "Connect" or "Disconnect".
  actionText?: string;
  isConnected?: boolean;
  className?: string;
  isLoading?: boolean;
  // If 'resync' has two distinct actions, you might need a second handler
  onSecondaryAction?: () => void;
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({
  logo,
  logoAlt,
  title,
  subtitle,
  actionType,
  onAction,
  actionText, // Kept, but original connect button text doesn't use it.
  isConnected,
  className,
  isLoading = false,
  onSecondaryAction, // For the second button in "resync"
}) => {
  return (
    <div className={`border border-border rounded-md pr-2 pl-0 py-0 flex justify-between items-center w-full ${className}`}>
      {/* Increased pr-2 for a bit more space for the button on the right */}
      <div className="flex items-center gap-2 p-sm flex-grow min-w-0"> {/* Added min-w-0 for flex-grow to not overflow */}
        {logo.includes("svg") ? (
          <div className="bg-content rounded p-1 border border-border flex-shrink-0"> {/* Added flex-shrink-0 */}
            <svg className="h-6 w-6" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          </div>
        ) : (
          <Image src={logo} alt={logoAlt} width={24} height={24} className="w-8 h-8 flex-shrink-0" /> // Added flex-shrink-0
        )}
        <div className="min-w-0"> {/* Added min-w-0 to allow text truncation if needed */}
          <div className={`text-sm text-muted-foreground truncate`}>{title}</div> {/* Added truncate */}
          <div className={`text-sm font-medium truncate`}>{subtitle}</div> {/* Added truncate */}
        </div>
      </div>

      {/* Action Buttons Section - aligned to the right */}
      <div className="flex items-center flex-shrink-0"> {/* Wrapper for buttons, prevents shrinking */}
        {actionType === "connect" && (
          <button // Changed div to button for accessibility
            type="button"
            className="border-border p-2 cursor-pointer rounded-md bg-hovered hover:bg-hovered transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={onAction}
            disabled={isLoading}
            aria-label={isLoading ? 'Processing connection' : (actionText || 'Connect account')}
          >
            <div className="flex justify-center items-center gap-2">
              {isLoading ? (
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
              ) : (
                <PlusIcon className="h-5 w-5 group-hover:text-primary" />
              )}
              <span className="hidden sm:inline text-sm text-muted-foreground">
                {/* Logic for connect button text based on isConnected and actionText */}
                {isLoading ? 'Processing...' : (isConnected ? 'Disconnect' : (actionText || 'Connect'))}
              </span>
            </div>
          </button>
        )}

        {actionType === "copy" && (
          <button // Changed div to button
            type="button"
            className="border-border p-2 cursor-pointer rounded-md bg-hovered hover:bg-hovered transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={onAction}
            aria-label="Copy"
          >
            <div className="flex justify-center items-center gap-2">
              <ClipboardIcon className="h-5 w-5 group-hover:text-primary" />
              <span className="hidden sm:inline text-sm text-muted-foreground">Copy</span>
            </div>
          </button>
        )}

        {actionType === "disconnect" && (
          <div className="flex items-center gap-1"> {/* Kept gap-1 as per original for this specific group */}
            <button // Changed div to button
              type="button"
              className="border-border p-2 cursor-pointer rounded-md bg-hovered hover:bg-hovered transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              // onClick={onAction} // Replaced with re-sync
              aria-label="Re-sync account"
            >
              <div className="flex justify-center items-center gap-2">
                <ArrowPathIcon title="Re-sync" className="h-5 w-5" /> {/* Icon for Re-sync */}
              </div>
            </button>
            <button // Changed div to button
              type="button"
              className="border-border p-2 cursor-pointer rounded-md bg-hovered hover:bg-hovered transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={onSecondaryAction || onAction} // Assumes a secondary action or the same onAction handles it
              aria-label="Cancel or disconnect"
            >
              <XMarkIcon title="Disconnect" className="h-5 w-5" />
              {/* Optional: Add text for this button on larger screens if desired */}
              {/* <span className="hidden sm:inline text-sm text-muted-foreground">Cancel</span> */}
            </button>
          </div>
        )}

        {actionType === "select-sender" && (
          <button // Changed div to button
            type="button"
            className="border-border p-2 cursor-pointer rounded-md bg-hovered hover:bg-hovered transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={onAction}
            aria-label="Select Sender"
          >
            <div className="flex justify-center items-center gap-2">
              {/* Icon first for better visual when text is hidden, then text */}
              <span className="hidden sm:inline text-sm text-muted-foreground">Select Sender</span>
              <ArrowRightIcon className="h-5 w-5 group-hover:text-primary text-muted-foreground" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default ConnectionCard;