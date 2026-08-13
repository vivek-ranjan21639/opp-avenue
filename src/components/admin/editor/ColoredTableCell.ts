import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

const cellAttrs = {
  backgroundColor: {
    default: null as string | null,
    parseHTML: (el: HTMLElement) =>
      el.style.backgroundColor || el.getAttribute('data-bg') || null,
    renderHTML: (attrs: { backgroundColor?: string | null }) => {
      if (!attrs.backgroundColor) return {};
      return {
        style: `background-color: ${attrs.backgroundColor};`,
        'data-bg': attrs.backgroundColor,
      };
    },
  },
};

export const ColoredTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...cellAttrs,
    };
  },
});

export const ColoredTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...cellAttrs,
    };
  },
});
