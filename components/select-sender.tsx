import React from "react";
import Reader from "./animations/reader";
const SelectSender = () => {
  return (
    <div className="w-full min-h-screen h-full flex items-center justify-center">
      <div className="flex flex-col w-full justify-center items-center h-full bg-muted/10">
        <Reader />
        <h1 className="text-xl font-medium text-muted-foreground">
          No sender selected
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Select a sender from the sidebar to view emails
        </p>
      </div>
    </div>
  );
};

export default SelectSender;
