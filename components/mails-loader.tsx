import React from "react";
import { Skeleton } from "./ui/skeleton";

export const MailItemSkeleton = () => (
  <div className="flex flex-col border-b border-border p-4 animate-pulse">
    <div className="flex justify-between items-start">
      <Skeleton className="h-6 w-2/3 mb-2" />
      <div className="flex space-x-1">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
    </div>
    <div className="flex items-center mt-2">
      <Skeleton className="h-4 w-4 rounded-full mr-2" />
      <Skeleton className="h-4 w-24 mr-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
);
