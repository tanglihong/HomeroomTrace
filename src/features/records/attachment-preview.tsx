"use client";

import { useEffect, useState } from "react";
import { IconMic } from "@/features/common/icons";
import { useAppContainer } from "@/lib/app-container";

const urlCache = new Map<string, string>();

interface AttachmentPreviewProps {
  path: string;
  kind: "photo" | "audio";
  compact?: boolean;
}

export function AttachmentPreview({ path, kind, compact }: AttachmentPreviewProps) {
  const container = useAppContainer();
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    let objectUrl: string | undefined;
    let cancelled = false;

    const cached = urlCache.get(path);
    if (cached) {
      setUrl(cached);
      return;
    }

    void (async () => {
      try {
        objectUrl = await container.mediaStore.url(path);
        if (cancelled) return;
        urlCache.set(path, objectUrl);
        setUrl(objectUrl);
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [container, path]);

  if (!url) {
    return <span className="record-subtitle">{compact ? "…" : "加载附件…"}</span>;
  }

  if (kind === "photo") {
    if (compact) {
      return <img className="attachment-thumb-image" src={url} alt="照片附件" />;
    }
    return (
      <div className="media-preview">
        <img src={url} alt="照片附件" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="attachment-thumb-audio">
        <IconMic size={22} />
        <span>录音</span>
      </div>
    );
  }

  return <audio className="audio-player" controls src={url} preload="none" />;
}
