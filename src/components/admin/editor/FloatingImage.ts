import Image from '@tiptap/extension-image';

/**
 * Extended Image extension with float, alignment, and width attributes.
 * Supports: float left/right (text wraps around), center (block, no wrap),
 * none (inline). Width is resizable via attribute. Drag-and-drop is enabled
 * by ProseMirror by default for selectable nodes.
 */
export const FloatingImage = Image.extend({
  draggable: true,
  selectable: true,
  inline: true,
  group: 'inline',

  addAttributes() {
    return {
      ...this.parent?.(),
      float: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-float') || el.style.float || null,
        renderHTML: (attrs) => {
          if (!attrs.float || attrs.float === 'none') return {};
          if (attrs.float === 'center') {
            return {
              'data-float': 'center',
              style: 'display:block;margin-left:auto;margin-right:auto;float:none;clear:both;',
            };
          }
          const styles: Record<string, string> = { float: attrs.float, clear: 'none' };
          if (attrs.float === 'left') {
            styles.marginRight = '1rem';
            styles.marginBottom = '0.5rem';
          } else if (attrs.float === 'right') {
            styles.marginLeft = '1rem';
            styles.marginBottom = '0.5rem';
          }
          return {
            'data-float': attrs.float,
            style: Object.entries(styles).map(([k, v]) => `${k}:${v}`).join(';'),
          };
        },
      },
      width: {
        default: null,
        parseHTML: (el) => el.getAttribute('width') || el.style.width || null,
        renderHTML: (attrs) => {
          if (!attrs.width) return {};
          return { width: attrs.width, style: `width:${attrs.width}` };
        },
      },
    };
  },
});
