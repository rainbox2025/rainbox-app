"use client";

import { useState, useEffect, useRef } from "react";
import {
  sendOtpAction,
  verifyOtpAndSignInAction,
  signInWithGoogleAction,
} from "@/app/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/icons"; // Make sure this path is correct
import Image from "next/image";
import Link from "next/link";
import ReCAPTCHA from "react-google-recaptcha";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast"; // Import react-hot-toast

export default function AuthPage() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [showNameField, setShowNameField] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // message state removed, using toast directly
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const messageParam = searchParams.get("message"); // For general messages from redirects
    const successParam = searchParams.get("success_message"); // More specific success from redirects

    if (errorParam) {
      toast.error(decodeURIComponent(errorParam));
    }
    if (messageParam) {
      // Can be used for general info/success from redirects
      toast.success(decodeURIComponent(messageParam));
    }
    if (successParam) {
      toast.success(decodeURIComponent(successParam));
    }
    // Consider removing params from URL after displaying to prevent re-toasting on refresh
    // if (errorParam || messageParam || successParam) {
    //   window.history.replaceState({}, document.title, window.location.pathname);
    // }
  }, [searchParams]);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !recaptchaToken) {
      toast.error("Please complete the reCAPTCHA.");
      return;
    }
    setIsLoading(true);
    toast.dismiss(); // Dismiss any existing toasts

    const result = await sendOtpAction(email, recaptchaToken);

    setIsLoading(false);
    if (result.status === "success") {
      toast.success(result.message);
      setStep("otp");
      setShowNameField(result.requiresName || false);
    } else {
      toast.error(result.message);
      if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
        recaptchaRef.current?.reset();
        setRecaptchaToken(null);
      }
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    toast.dismiss();

    try {
      const result = await verifyOtpAndSignInAction(
        email,
        otp,
        name,
        showNameField
      );
      if (result && result.status === "error") {
        toast.error(result.message);
        setIsLoading(false);
      }
      // On success, verifyOtpAndSignInAction handles redirect. setIsLoading(false) might not be reached.
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  const onRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
    if (token) toast.dismiss(); // Clear "Please complete reCAPTCHA" toast if user interacts
  };

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  const [captchaTheme, setCaptchaTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setCaptchaTheme(mediaQuery.matches ? "light" : "light");
      const handler = (e: MediaQueryListEvent) =>
        setCaptchaTheme(e.matches ? "light" : "light");
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, []);

  // --- Style Definitions Based on Your Provided Code ---
  const inputBaseClasses =
    "h-12 px-4 rounded-xl border-hovered hover:bg-secondary text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"; // Added focus-visible for better accessibility from shadcn/ui Input
  const placeholderClasses = "placeholder:text-muted-foreground"; // Your email input doesn't have a specific placeholder class, this is a common way

  const primaryButtonBaseClasses =
    "w-full h-12 bg-secondary hover:bg-hovered text-primary rounded-xl font-medium text-base";
  const googleButtonClasses =
    "w-full h-12 flex items-center justify-center px-4 rounded-xl border-hovered hover:bg-secondary text-muted-foreground";

  return (
    <div className="flex flex-col items-center justify-between py-10 min-h-screen font-sans ">
      {" "}
      {/* Assuming bg-background is defined for page bg */}
      <Toaster position="top-center" reverseOrder={false} />
      <div>
        <div className="w-full flex items-center justify-center mb-0">
          <Image
            src="/logo-lg.png"
            alt="Rainbox logo"
            width={150}
            height={50}
            className="h-auto object-contain dark:invert"
          />
        </div>

        <h2 className="text-center text-muted-foreground mb-6 text-md italic">
          All your newsletters in one place
        </h2>
      </div>
      <div>
        <p className="text-center text-muted-foreground text-md mt-4  mb-2">
          Get started - Sign - in or create an account
        </p>

        <form action={signInWithGoogleAction} className="mb-3">
          <Button
            type="submit"
            variant="outline" // This variant might have its own base style from your ui/button
            className={googleButtonClasses} // Applying consistent Google button style
            disabled={isLoading}
          >
            <GoogleIcon className="mr-2.5 h-5 w-5" /> Continue with Google
          </Button>
        </form>

        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-hovered"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-content px-3 text-muted-foreground">Or</span>
          </div>
        </div>

        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div>
              <Input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`${inputBaseClasses} ${placeholderClasses}`} // Consistent input style
                disabled={isLoading}
              />
            </div>
            {siteKey && (
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={siteKey}
                onChange={onRecaptchaChange}
                theme={captchaTheme}
                className="flex justify-center align-center rounded-xl"
              />
            )}
            <Button
              type="submit"
              className={primaryButtonBaseClasses} // Consistent primary button style
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Continue with email"}
            </Button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div>
              <Input
                type="email"
                name="emailDisplay"
                value={email}
                readOnly
                className={`${inputBaseClasses} ${placeholderClasses} bg-secondary cursor-not-allowed`} // Consistent + readonly indication
              />
            </div>
            {showNameField && (
              <div>
                <Input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={`${inputBaseClasses} ${placeholderClasses}`} // Consistent input style
                  disabled={isLoading}
                />
              </div>
            )}
            <div>
              <Input
                type="text"
                name="otp"
                placeholder="Enter the 6 digit code sent to your email"
                value={otp}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val) && val.length <= 6) setOtp(val);
                }}
                required
                minLength={6}
                maxLength={6}
                className={`${inputBaseClasses} ${placeholderClasses}`} // Consistent input style
                disabled={isLoading}
                autoComplete="one-time-code"
                inputMode="numeric"
              />
            </div>
            <Button
              type="submit"
              className={primaryButtonBaseClasses}
              disabled={isLoading}
            >
              {isLoading ? (
                "Verifying..."
              ) : (
                <>
                  Continue
                  <ArrowRightIcon className="w-5 h-5 inline ml-1" />
                </>
              )}
            </Button>
            {/* <Button
              type="button"
              variant="link" // This variant should be styled appropriately in your ui/button component
              onClick={() => {
                setStep("email");
                setShowNameField(false);
                setOtp("");
                if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
                  recaptchaRef.current?.reset();
                  setRecaptchaToken(null);
                }
              }}
              disabled={isLoading}
              className="w-full text-sm text-primary hover:text-primary hover:underline p-0 h-auto" // Using text-primary, hover:underline for link
            >
              Use a different email or resend code
            </Button> */}
          </form>
        )}
      </div>
      <div className="text-xs text-muted-foreground mt-8 text-center">
        {" "}
        {/* Used text-muted-foreground */}
        By continuing you agree to the <br />
        <Link href="/terms" className="underline hover:text-primary">
          {" "}
          {/* Using text-primary for link hover */}
          Terms of Use
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-primary">
          {" "}
          {/* Using text-primary for link hover */}
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}
