import { useState, useEffect } from "react";
import { ExternalLink, X } from "lucide-react";
import { useActiveNotices, NoticePageKey } from "@/hooks/useNotices";

interface NoticeBannerProps {
  page: NoticePageKey;
}

const STORAGE_KEY = "dismissed-notices";

function getDismissed(): string[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setDismissed(ids: string[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export default function NoticeBanner({ page }: NoticeBannerProps) {
  const { data: notices = [] } = useActiveNotices(page);
  const [dismissed, setDismissedState] = useState<string[]>([]);

  useEffect(() => {
    setDismissedState(getDismissed());
  }, []);

  const visible = notices.filter((n) => !dismissed.includes(n.id));
  if (visible.length === 0) return null;

  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissedState(next);
    setDismissed(next);
  };

  return (
    <div className="relative z-50 w-full">
      {visible.map((n) => {
        const content = (
          <span className="inline-flex items-center gap-1.5 underline decoration-current/40 underline-offset-2 hover:decoration-current">
            {n.message}
            {n.link_url && <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />}
          </span>
        );
        return (
          <div
            key={n.id}
            className="flex items-center justify-center px-4 py-2 text-sm font-medium bg-[hsl(0,72%,45%)] text-white shadow-sm"
          >
            <span className="inline-flex items-center gap-2">
              {n.link_url ? (
                <a
                  href={n.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  {content}
                </a>
              ) : (
                content
              )}
              <button
                type="button"
                onClick={() => dismiss(n.id)}
                aria-label="Dismiss notice"
                className="flex-shrink-0 p-0.5 rounded hover:bg-white/15 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          </div>
        );
      })}
    </div>
  );
}
