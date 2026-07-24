"use client";

import type { useToast } from "@/features/common/toast";

type ToastApi = ReturnType<typeof useToast>;

let activeRoot: HTMLDivElement | null = null;
let activeTimer: ReturnType<typeof setTimeout> | null = null;

function dismissActive(): void {
  if (activeTimer) {
    clearTimeout(activeTimer);
    activeTimer = null;
  }
  activeRoot?.remove();
  activeRoot = null;
}

/** 带撤销操作的 Toast；底层 Toast 无法延长时，使用独立横幅。 */
export function showUndoToast(
  _toast: ToastApi,
  message: string,
  onUndo: () => void,
  ms = 5000,
): void {
  dismissActive();

  const root = document.createElement("div");
  root.className = "toast-banner toast-undo";
  root.setAttribute("role", "status");
  root.innerHTML = `
    <span class="toast-undo-message"></span>
    <button type="button" class="toast-undo-btn">撤销</button>
  `;

  const messageEl = root.querySelector(".toast-undo-message")!;
  messageEl.textContent = message;

  const undoBtn = root.querySelector(".toast-undo-btn") as HTMLButtonElement;
  undoBtn.addEventListener("click", () => {
    dismissActive();
    onUndo();
  });

  document.body.appendChild(root);
  activeRoot = root;

  activeTimer = setTimeout(() => {
    dismissActive();
  }, ms);
}
