import { Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { AlignLeft, AlignCenter, AlignRight, Square, Trash2, Minus, Plus } from 'lucide-react';

interface Props {
  editor: Editor;
}

const WIDTH_PRESETS = ['25%', '50%', '75%', '100%'];

export default function ImageBubbleMenu({ editor }: Props) {
  const updateImage = (attrs: Record<string, string | null>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor.chain().focus() as any).updateAttributes('image', attrs).run();
  };

  const removeImage = () => {
    editor.chain().focus().deleteSelection().run();
  };

  const adjustWidth = (delta: number) => {
    const current = editor.getAttributes('image').width;
    const numeric = current ? parseInt(String(current).replace('%', ''), 10) : 100;
    const next = Math.max(10, Math.min(100, numeric + delta));
    updateImage({ width: `${next}%` });
  };

  const Btn = ({
    onClick, active, title, children,
  }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${
        active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
      }`}
    >
      {children}
    </button>
  );

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor }) => editor.isActive('image')}
      options={{ placement: 'top', offset: 8 }}
      className="flex items-center gap-0.5 p-1 bg-popover border border-border rounded-lg shadow-lg"
    >
      <Btn
        onClick={() => updateImage({ float: 'left' })}
        active={editor.getAttributes('image').float === 'left'}
        title="Float left (text wraps right)"
      >
        <AlignLeft className="h-4 w-4" />
      </Btn>
      <Btn
        onClick={() => updateImage({ float: 'center' })}
        active={editor.getAttributes('image').float === 'center'}
        title="Center (block)"
      >
        <AlignCenter className="h-4 w-4" />
      </Btn>
      <Btn
        onClick={() => updateImage({ float: 'right' })}
        active={editor.getAttributes('image').float === 'right'}
        title="Float right (text wraps left)"
      >
        <AlignRight className="h-4 w-4" />
      </Btn>
      <Btn
        onClick={() => updateImage({ float: null })}
        active={!editor.getAttributes('image').float}
        title="Inline (no wrap)"
      >
        <Square className="h-4 w-4" />
      </Btn>

      <div className="w-px h-5 bg-border mx-1" />

      <Btn onClick={() => adjustWidth(-10)} title="Decrease size">
        <Minus className="h-4 w-4" />
      </Btn>
      {WIDTH_PRESETS.map((w) => (
        <button
          key={w}
          type="button"
          title={`Set width ${w}`}
          onClick={() => updateImage({ width: w })}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            editor.getAttributes('image').width === w
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted text-foreground'
          }`}
        >
          {w}
        </button>
      ))}
      <Btn onClick={() => adjustWidth(10)} title="Increase size">
        <Plus className="h-4 w-4" />
      </Btn>

      <div className="w-px h-5 bg-border mx-1" />

      <Btn onClick={removeImage} title="Remove image">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Btn>
    </BubbleMenu>
  );
}
