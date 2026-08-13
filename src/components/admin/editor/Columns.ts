import { Node, mergeAttributes } from '@tiptap/core';

/**
 * Multi-column layout: a `columns` node containing `column` nodes.
 * Each column accepts block content (paragraphs, headings, lists, images, etc.).
 * Renders as a CSS grid using `.editor-columns` + `.editor-columns-N` classes.
 */
export const Column = Node.create({
  name: 'column',
  group: 'column',
  content: 'block+',
  isolating: true,
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="column"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'column',
        class: 'editor-column',
      }),
      0,
    ];
  },
});

export const Columns = Node.create({
  name: 'columns',
  group: 'block',
  content: 'column{2,6}',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      cols: {
        default: 2,
        parseHTML: (el) => parseInt(el.getAttribute('data-cols') || '2', 10),
        renderHTML: (attrs) => ({
          'data-cols': String(attrs.cols),
          class: `editor-columns editor-columns-${attrs.cols}`,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="columns"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'columns' }),
      0,
    ];
  },

  addCommands() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      insertColumns:
        (cols: number) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ commands }: any) => {
          const n = Math.max(2, Math.min(6, cols));
          const content = Array.from({ length: n }, () => ({
            type: 'column',
            content: [{ type: 'paragraph' }],
          }));
          return commands.insertContent([
            { type: 'columns', attrs: { cols: n }, content },
            { type: 'paragraph' },
          ]);
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deleteColumns:
        () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ state, dispatch }: any) => {
          const { $from } = state.selection;
          for (let d = $from.depth; d > 0; d--) {
            const node = $from.node(d);
            if (node.type.name === 'columns') {
              if (dispatch) {
                const start = $from.before(d);
                const end = $from.after(d);
                dispatch(state.tr.delete(start, end).scrollIntoView());
              }
              return true;
            }
          }
          return false;
        },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  },
});
