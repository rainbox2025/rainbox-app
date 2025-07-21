import Image from "next/image";
import {
  ArrowRightIcon,
  ClipboardIcon,
  PlusIcon,
  XMarkIcon,
  TrashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

type ConnectionCardProps = {
  logo: string;
  logoAlt: string;
  title: string;
  subtitle?: string | null;
  actionType?:
  | "connect"
  | "copy"
  | "disconnect"
  | "select-sender"
  | "manage-secondary";
  onAction?: () => void;
  actionText?: string;
  isConnected?: boolean;
  className?: string;
  isLoading?: boolean;
  onSecondaryAction?: () => void;
};

const ConnectionCard: React.FC<ConnectionCardProps> = ({
  logo,
  logoAlt,
  title,
  subtitle,
  actionType,
  onAction,
  actionText,
  isConnected,
  className,
  isLoading = false,
  onSecondaryAction,
}) => {
  return (
    <div
      className={`border border-border rounded-md pr-2 pl-0 py-0 flex justify-between items-center w-full ${className}`}
    >
      <div className="flex items-center gap-2 p-sm flex-grow min-w-0">
        {logo.includes("svg") ? (
          <div className="bg-content rounded p-1 border border-border flex-shrink-0">
            <svg className="h-6 w-6" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          </div>
        ) : (
          <Image
            src={logo}
            alt={logoAlt}
            width={24}
            height={24}
            className="w-8 h-8 flex-shrink-0"
          />
        )}
        <div className="min-w-0">
          <div className={`text-sm text-muted-foreground truncate`}>
            {title}
          </div>
          <div className={`text-sm font-medium truncate`}>{subtitle}</div>
        </div>
      </div>

      <div className="flex items-center flex-shrink-0">
        {actionType === "connect" && (
          <button
            type="button"
            className="border-border p-2 cursor-pointer rounded-md bg-hovered hover:bg-hovered transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={onAction}
            disabled={isLoading}
            aria-label={
              isLoading
                ? "Processing connection"
                : actionText || "Connect account"
            }
          >
            <div className="flex justify-center items-center gap-2">
              {isLoading ? (
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
              ) : (
                <PlusIcon className="h-5 w-5 group-hover:text-primary" />
              )}
              <span className="hidden sm:inline text-sm text-muted-foreground">
                {isLoading
                  ? "Processing..."
                  : isConnected
                    ? "Disconnect"
                    : actionText || "Connect"}
              </span>
            </div>
          </button>
        )}
        {actionType === "copy" && (
          <button
            type="button"
            className="border-border p-2 cursor-pointer rounded-md bg-hovered hover:bg-hovered transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={onAction}
            aria-label="Copy"
          >
            <div className="flex justify-center items-center gap-2">
              <ClipboardIcon className="h-5 w-5 group-hover:text-primary" />
              <span className="hidden sm:inline text-sm text-muted-foreground">
                Copy
              </span>
            </div>
          </button>
        )}
        {actionType === "disconnect" && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="border-border p-2 cursor-pointer rounded-md bg-hovered hover:bg-hovered transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Re-sync account"
            >
              <div className="flex justify-center items-center gap-2">
                <ArrowPathIcon title="Re-sync" className="h-5 w-5" />
              </div>
            </button>
            <button
              type="button"
              className="border-border p-2 cursor-pointer rounded-md bg-hovered hover:bg-hovered transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={onSecondaryAction || onAction}
              aria-label="Cancel or disconnect"
            >
              <XMarkIcon title="Disconnect" className="h-5 w-5" />
            </button>
          </div>
        )}
        {actionType === "select-sender" && (
          <button
            type="button"
            className="border-border p-2 cursor-pointer rounded-md bg-hovered hover:bg-hovered transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={onAction}
            aria-label="Select Sender"
          >
            <div className="flex justify-center items-center gap-2">
              <span className="hidden sm:inline text-sm text-muted-foreground">
                Select Sender
              </span>
              <ArrowRightIcon className="h-5 w-5 group-hover:text-primary text-muted-foreground" />
            </div>
          </button>
        )}
        {actionType === "manage-secondary" && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="border-border p-2 cursor-pointer rounded-md bg-hovered hover:bg-hovered transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={onAction}
              aria-label="Copy Email"
            >
              <ClipboardIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="border-border p-2 cursor-pointer rounded-md bg-hovered hover:bg-hovered transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={onSecondaryAction}
              aria-label="Delete Email"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionCard;