import { useEffect, useRef, useCallback, useState } from "react";
import { toast } from "@/hooks/use-toast";

interface AutoSaveOptions {
  /** Unique key for localStorage, e.g. "blog-editor-{id}" or "blog-editor-new" */
  storageKey: string;
  /** Current form data to persist */
  formData: Record<string, any>;
  /** Called when the component mounts with saved data from localStorage */
  onRestore: (data: Record<string, any>) => void;
  /** Called to auto-save as draft to the database. Return true if save succeeded. */
  onAutoSave: () => Promise<boolean>;
  /** Whether this is a new entry (no ID yet) or editing existing */
  isNew: boolean;
  /** Whether the form has been explicitly saved by the user */
  isSaved: boolean;
  /** Whether form has meaningful data worth saving */
  hasContent: () => boolean;
  /** Whether data has been loaded from DB (for edit mode) */
  isReady: boolean;
}

const LS_PREFIX = "admin-draft-";

/**
 * Hook that:
 * 1. Persists form state to localStorage on every change
 * 2. Restores from localStorage on mount (for new entries, or as fallback)
 * 3. Clears localStorage after successful explicit save
 * 4. Shows browser prompt on close/refresh if unsaved
 *
 * NOTE: useBlocker is NOT used because the app uses <BrowserRouter> (not a Data Router).
 */
export function useAutoSaveDraft({
  storageKey,
  formData,
  onRestore,
  onAutoSave,
  isNew,
  isSaved,
  hasContent,
  isReady,
}: AutoSaveOptions) {
  const fullKey = LS_PREFIX + storageKey;
  const hasRestored = useRef(false);
  const isSavedRef = useRef(isSaved);
  const hasContentRef = useRef(hasContent);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  isSavedRef.current = isSaved;
  hasContentRef.current = hasContent;

  // Restore from localStorage on mount
  useEffect(() => {
    if (hasRestored.current) return;
    if (!isReady) return;

    const saved = localStorage.getItem(fullKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        onRestore(parsed);
        toast({
          title: "Draft restored",
          description: "We recovered your unsaved changes from your last session.",
        });
      } catch {
        localStorage.removeItem(fullKey);
      }
    }
    hasRestored.current = true;
  }, [fullKey, onRestore, isReady]);

  // Persist to localStorage on every change (debounced)
  useEffect(() => {
    if (!hasRestored.current) return;
    if (!isReady) return;

    const timer = setTimeout(() => {
      localStorage.setItem(fullKey, JSON.stringify(formData));
      setLastSavedAt(new Date());
    }, 500);
    return () => clearTimeout(timer);
  }, [fullKey, formData, isReady]);

  // Clear localStorage after explicit save
  useEffect(() => {
    if (isSaved) {
      localStorage.removeItem(fullKey);
    }
  }, [isSaved, fullKey]);

  // Handle browser close/refresh
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isSavedRef.current && hasContentRef.current()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  return {
    lastSavedAt,
    clearDraft: useCallback(() => {
      localStorage.removeItem(fullKey);
      setLastSavedAt(null);
    }, [fullKey]),
  };
}

/** Get list of draft keys for a given entity type */
export function getDraftKeys(entityType: "job" | "blog" | "resource"): string[] {
  const prefix = LS_PREFIX + entityType + "-";
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) keys.push(key);
  }
  return keys;
}

/** Clear saved editor data for a specific job or the unsaved new-job draft. */
export function clearJobDraftCache(jobId?: string) {
  localStorage.removeItem(`${LS_PREFIX}job-${jobId || "new"}`);
}

/** Clear saved editor data for deleted jobs. */
export function clearJobDraftCaches(jobIds: string[]) {
  jobIds.forEach((id) => clearJobDraftCache(id));
}
