"use client";

import { useEffect } from "react";
import { startAccountSession } from "@/lib/account";

/** Mounted once in the root layout: loads the signed-in user and syncs progress. */
export default function AccountSession() {
  useEffect(() => startAccountSession(), []);
  return null;
}
