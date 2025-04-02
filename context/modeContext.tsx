"use client";
import { createContext, useContext, useState } from "react";

interface ModeContextType {
  mode: "bookmarks" | "mailbox" | "discover";
  setMode: (mode: "bookmarks" | "mailbox" | "discover") => void;
}
export const ModeContext = createContext<ModeContextType>({
  mode: "mailbox",
  setMode: () => {},
});
export const useMode = () => {
  const { mode, setMode } = useContext(ModeContext);
  return { mode, setMode };
};
export const ModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<"bookmarks" | "mailbox" | "discover">(
    "mailbox"
  );
  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ModeContext.Provider>
  );
};
