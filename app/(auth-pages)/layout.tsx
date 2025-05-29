"use client";
import "./auth.css";
import React from "react";

import Image from "next/image";
interface AuthLayoutProps {
  children: React.ReactNode;
}

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* <div className="hidden relative overflow-hidden  md:w-1/2 md:flex items-center border justify-center">
        <svg
          style={{ left: "20%", top: "-35%", width: "65%", height: "65%" }}
          className="background-circle"
          viewBox="0 0 1040 1040"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M520 808.889C679.549 808.889 808.889 679.549 808.889 520C808.889 360.451 679.549 231.111 520 231.111C360.451 231.111 231.111 360.451 231.111 520C231.111 679.549 360.451 808.889 520 808.889ZM520 1040C807.188 1040 1040 807.188 1040 520C1040 232.812 807.188 0 520 0C232.812 0 0 232.812 0 520C0 807.188 232.812 1040 520 1040Z"
          />
        </svg>
        <svg
          style={{ left: "-10%", top: "82%", width: "35%", height: "35%" }}
          className="background-circle"
          viewBox="0 0 1040 1040"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M520 808.889C679.549 808.889 808.889 679.549 808.889 520C808.889 360.451 679.549 231.111 520 231.111C360.451 231.111 231.111 360.451 231.111 520C231.111 679.549 360.451 808.889 520 808.889ZM520 1040C807.188 1040 1040 807.188 1040 520C1040 232.812 807.188 0 520 0C232.812 0 0 232.812 0 520C0 807.188 232.812 1040 520 1040Z"
          />
        </svg>

        <div className="image-row">
          <div className="image-logo">
            <Image
              src="/logo-lg.png"
              alt="Feedly logo"
              width={200}
              height={200}
              className="w-full h-full object-contain dark:invert"
            />
          </div>
        </div>
      </div> */}

      <div className="content-container">
        {children}
      </div>
    </div >
  );
}

export default AuthLayout;
