import { useCallback, useMemo, useState } from "react";

/**
 * Generic row-selection hook for admin lists.
 * Tracks a set of selected ids and offers helpers for toggle / select-all / clear.
 * Selections are automatically pruned to ids still present in the current row list,
 * so paging / filtering / refetch don't leave stale ids behind.
 */
export function useRowSelection<T extends { id: string }>(rows: T[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const visibleSelected = useMemo(
    () => new Set(allIds.filter((id) => selected.has(id))),
    [allIds, selected],
  );

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const allSelected = allIds.length > 0 && allIds.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        for (const id of allIds) next.delete(id);
        return next;
      }
      const next = new Set(prev);
      for (const id of allIds) next.add(id);
      return next;
    });
  }, [allIds]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  const selectedRows = useMemo(
    () => rows.filter((r) => selected.has(r.id)),
    [rows, selected],
  );

  const allChecked = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someChecked = !allChecked && allIds.some((id) => selected.has(id));

  return {
    selectedIds: Array.from(visibleSelected),
    selectedRows,
    count: visibleSelected.size,
    isSelected,
    toggle,
    toggleAll,
    clear,
    allChecked,
    someChecked,
  };
}
