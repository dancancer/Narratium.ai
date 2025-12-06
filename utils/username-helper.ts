/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                        Username Helper                                   ║
 * ║  显示名的存储与事件通知：读写封装 + 事件广播                                ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { getString, setString } from "@/lib/storage/client-storage";

/**
 * Get the current display username for character dialogues
 * Returns displayUsername if set, otherwise falls back to login username
 */
export function getDisplayUsername(): string {
  const displayUsername = getString("displayUsername");
  const loginUsername = getString("username");

  return displayUsername || loginUsername || "";
}

/**
 * Set the display username for character dialogues
 */
export function setDisplayUsername(username: string): void {
  setString("displayUsername", username);

  // Trigger a custom event to notify components that username has changed
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("displayUsernameChanged", {
        detail: { displayUsername: username },
      })
    );
  }
}

/**
 * Reset display username to login username
 */
export function resetDisplayUsername(): void {
  const loginUsername = getString("username");
  setDisplayUsername(loginUsername);
}
