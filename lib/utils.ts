import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function stripHtml(html: string): string {
  // Create a temporary DOM element
  const tempElement = document.createElement("div");
  tempElement.innerHTML = html;

  // Return the text content
  return tempElement.textContent || tempElement.innerText || "";
}
