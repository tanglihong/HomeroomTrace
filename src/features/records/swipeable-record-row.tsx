"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import type { WorkRecordDTO } from "@/domain/use-cases/repositories";

const DELETE_WIDTH = 80;
const OPEN_THRESHOLD = 40;

interface SwipeableRecordRowProps {
  record: WorkRecordDTO;
  href: string;
  children: ReactNode;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function SwipeableRecordRow({
  record,
  href,
  children,
  open,
  onOpen,
  onClose,
  onDelete,
}: SwipeableRecordRowProps) {
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startOffsetRef = useRef(0);
  const movedRef = useRef(false);
  const dragOffsetRef = useRef(0);

  const settledOffset = open ? -DELETE_WIDTH : 0;
  const displayOffset = dragOffset ?? settledOffset;
  const revealProgress = Math.min(1, Math.abs(displayOffset) / DELETE_WIDTH);
  const actionOffset = DELETE_WIDTH * (1 - revealProgress);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startXRef.current = e.clientX;
    startOffsetRef.current = open ? -DELETE_WIDTH : 0;
    movedRef.current = false;
    draggingRef.current = true;
    dragOffsetRef.current = startOffsetRef.current;
    setDragging(true);
    setDragOffset(startOffsetRef.current);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > 4) movedRef.current = true;
    const next = Math.min(0, Math.max(-DELETE_WIDTH, startOffsetRef.current + delta));
    dragOffsetRef.current = next;
    setDragOffset(next);
  };

  const onPointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    const finalOffset = dragOffsetRef.current;
    setDragOffset(null);
    if (finalOffset <= -OPEN_THRESHOLD) onOpen();
    else onClose();
  };

  const onRowClick = (e: React.MouseEvent) => {
    if (movedRef.current) {
      e.preventDefault();
      return;
    }
    if (open) {
      e.preventDefault();
      onClose();
    }
  };

  const animating = !dragging;

  return (
    <div className="swipe-row">
      <div
        className="swipe-row-actions"
        style={{
          transform: `translateX(${actionOffset}px)`,
          transition: animating ? "transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)" : "none",
        }}
      >
        <button type="button" className="swipe-delete-btn" onClick={() => onDelete(record.id)}>
          删除
        </button>
      </div>
      <div
        className={`swipe-row-front ios-row has-chevron record-row ${dragging ? "is-dragging" : ""}`}
        style={{
          transform: `translateX(${displayOffset}px)`,
          transition: animating ? "transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)" : "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <Link href={href} prefetch className="swipe-row-link" onClick={onRowClick} draggable={false}>
          {children}
        </Link>
      </div>
    </div>
  );
}
