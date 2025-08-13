import { Mail } from "@/types/data";
import React from "react";

const SenderAvatar = ({ domain, alt }: { domain: string; alt: string }) => {
  return (
    <img
      src={
        domain === "gmail.com"
          ? "/gmail.webp"
          : `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
      }
      alt={alt}
      className="w-10 h-10 rounded-full object-cover mr-3 border border-border"
    />
  );
};

export default SenderAvatar;
