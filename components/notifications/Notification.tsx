"use client";
import React, { useEffect } from "react";
import {
  generateToken,
  messaging,
} from "../../components/notifications/firebase";
import { onMessage } from "firebase/messaging";

export default function Notification() {
  useEffect(() => {
    generateToken();
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log("Message received. ", payload);
      });
    }
  });

  return null;
}
