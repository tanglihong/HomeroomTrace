"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppContainer } from "@/lib/app-container";
import { resolveMediaUrl } from "@/features/records/attachment-preview";

interface PhotoLightboxProps {
  paths: string[];
  initialIndex?: number;
  onClose: () => void;
}

export function PhotoLightbox({ paths, initialIndex = 0, onClose }: PhotoLightboxProps) {
  const container = useAppContainer();
  const [index, setIndex] = useState(initialIndex);
  const [url, setUrl] = useState<string>();
  const [loadError, setLoadError] = useState(false);

  const path = paths[index];
  const hasMultiple = paths.length > 1;

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex, paths]);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    setUrl(undefined);
    setLoadError(false);

    void resolveMediaUrl(container.mediaStore, path)
      .then((resolved) => {
        if (!cancelled) setUrl(resolved);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [container.mediaStore, path]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && hasMultiple) {
        setIndex((current) => (current - 1 + paths.length) % paths.length);
      }
      if (event.key === "ArrowRight" && hasMultiple) {
        setIndex((current) => (current + 1) % paths.length);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hasMultiple, onClose, paths.length]);

  const showPrevious = useCallback(() => {
    setIndex((current) => (current - 1 + paths.length) % paths.length);
  }, [paths.length]);

  const showNext = useCallback(() => {
    setIndex((current) => (current + 1) % paths.length);
  }, [paths.length]);

  if (!path) return null;

  return (
    <div
      className="photo-lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="查看照片"
      onClick={onClose}
    >
      <div className="photo-lightbox-toolbar" onClick={(event) => event.stopPropagation()}>
        {hasMultiple ? (
          <span className="photo-lightbox-counter">
            {index + 1} / {paths.length}
          </span>
        ) : (
          <span />
        )}
        <button type="button" className="photo-lightbox-close" onClick={onClose} aria-label="关闭">
          关闭
        </button>
      </div>

      <div className="photo-lightbox-stage" onClick={(event) => event.stopPropagation()}>
        {hasMultiple && (
          <button type="button" className="photo-lightbox-nav photo-lightbox-nav-prev" onClick={showPrevious} aria-label="上一张">
            ‹
          </button>
        )}

        {loadError ? (
          <span className="photo-lightbox-error">照片加载失败</span>
        ) : url ? (
          <img className="photo-lightbox-image" src={url} alt={`照片 ${index + 1}`} />
        ) : (
          <span className="photo-lightbox-loading">加载中…</span>
        )}

        {hasMultiple && (
          <button type="button" className="photo-lightbox-nav photo-lightbox-nav-next" onClick={showNext} aria-label="下一张">
            ›
          </button>
        )}
      </div>
    </div>
  );
}
