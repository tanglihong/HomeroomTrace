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
  const [loadError, setLoadError] = useState(false);
  const [playError, setPlayError] = useState(false);

  useEffect(() => {
    let objectUrl: string | undefined;
    let cancelled = false;
    setLoadError(false);
    setPlayError(false);

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
        if (!cancelled) setLoadError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [container, path]);

  if (loadError) {
    return <span className="record-subtitle">{compact ? "加载失败" : "附件加载失败"}</span>;
  }

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

  if (playError) {
    return <span className="record-subtitle">当前设备无法播放此录音格式</span>;
  }

  return (
    <audio
      className="audio-player"
      controls
      src={url}
      preload="metadata"
      playsInline
      onError={() => setPlayError(true)}
    />
  );
}
