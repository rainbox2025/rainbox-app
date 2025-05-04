import { useState } from "react";
import Image from "next/image";
import { ClipboardIcon, XMarkIcon } from "@heroicons/react/24/outline";

type ConnectionCardProps = {
  logo: string;           // URL or path to logo image
  logoAlt: string;        // Alt text for the logo
  title: string;          // Primary title text
  subtitle?: string;      // Secondary subtitle text
  actionType?: string;    // "connect", "disconnect", "copy" or any custom action
  onAction?: () => void;  // Function to call when the action button is clicked
  actionText?: string;    // Optional text for connect button (only used when actionType is "connect")
  isConnected?: boolean;   // Whether this account is connected (affects styling)
  className?: string;     // Additional class names
}
const ConnectionCard: React.FC<ConnectionCardProps> = ({
  logo,
  logoAlt,
  title,
  subtitle,
  actionType,
  onAction,
  actionText,
  isConnected,
  className
}) => {
  return (
    <div className={`border border-border rounded-md flex justify-between items-center w-full ${className}`}>
      <div className="flex items-center gap-3 p-sm flex-grow">
        {logo.includes("svg") ? (
          // For SVG logos (like Google)
          <div className="bg-content rounded p-1 border border-border">
            <svg className="h-6 w-6" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          </div>
        ) : (
          // For other image logos
          <Image src={logo} alt={logoAlt} width={24} height={24} className="w-8 h-8" />
        )}
        <div>
          <div className={`text-sm text-muted-foreground`}>{title}</div>
          <div className={`text-sm font-medium`}>{subtitle}</div>
        </div>
      </div>
      <div
        className=" border-border p-3 mr-1 cursor-pointer rounded-md bg-sidebar hover:bg-hovered transition-colors text-sm"
        onClick={onAction}
      >
        {actionType === "connect" ? (
          <span className="text-sm">{actionText || "+ Connect"}</span>
        ) : actionType === "disconnect" ? (
          <XMarkIcon className="h-5 w-5" />
        ) : actionType === "copy" ? (
          <ClipboardIcon className="h-5 w-5 hover:text-primary" />
        ) : null}
      </div>
    </div>
  );
};

export default ConnectionCard;