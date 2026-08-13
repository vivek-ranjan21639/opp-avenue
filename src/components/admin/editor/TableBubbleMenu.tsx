import { Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Rows3, Columns3, Trash2, Merge, Split, Paintbrush,
  ArrowUpToLine, ArrowDownToLine, ArrowLeftToLine, ArrowRightToLine,
  SquareX, RowsIcon,
} from 'lucide-react';

const CELL_COLORS = [
  null, '#FEE2E2', '#FED7AA', '#FEF3C7', '#D9F99D', '#BBF7D0',
  '#A5F3FC', '#BFDBFE', '#DDD6FE', '#FBCFE8', '#E5E7EB', '#FFFFFF',
];

interface Props {
  editor: Editor;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cmd = (editor: Editor) => editor.chain().focus() as any;

export default function TableBubbleMenu({ editor }: Props) {
  const setCellBg = (color: string | null) => {
    cmd(editor).setCellAttribute('backgroundColor', color).run();
  };

  const Btn = ({
    onClick, title, children,
  }: { onClick: () => void; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="p-1.5 rounded transition-colors hover:bg-muted text-foreground"
    >
      {children}
    </button>
  );

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor }) => editor.isActive('table')}
      options={{ placement: 'top', offset: 8 }}
      className="flex items-center gap-0.5 p-1 bg-popover border border-border rounded-lg shadow-lg flex-wrap max-w-[480px]"
    >
      {/* Row controls */}
      <Btn onClick={() => cmd(editor).addRowBefore().run()} title="Add row above">
        <ArrowUpToLine className="h-4 w-4" />
      </Btn>
      <Btn onClick={() => cmd(editor).addRowAfter().run()} title="Add row below">
        <ArrowDownToLine className="h-4 w-4" />
      </Btn>
      <Btn onClick={() => cmd(editor).deleteRow().run()} title="Delete row">
        <div className="relative">
          <Rows3 className="h-4 w-4" />
          <SquareX className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-destructive" />
        </div>
      </Btn>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Column controls */}
      <Btn onClick={() => cmd(editor).addColumnBefore().run()} title="Add column left">
        <ArrowLeftToLine className="h-4 w-4" />
      </Btn>
      <Btn onClick={() => cmd(editor).addColumnAfter().run()} title="Add column right">
        <ArrowRightToLine className="h-4 w-4" />
      </Btn>
      <Btn onClick={() => cmd(editor).deleteColumn().run()} title="Delete column">
        <div className="relative">
          <Columns3 className="h-4 w-4" />
          <SquareX className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-destructive" />
        </div>
      </Btn>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Selection helpers */}
      <Btn onClick={() => cmd(editor).toggleHeaderRow().run()} title="Toggle header row">
        <RowsIcon className="h-4 w-4" />
      </Btn>
      <Btn onClick={() => cmd(editor).toggleHeaderColumn().run()} title="Toggle header column">
        <Columns3 className="h-4 w-4" />
      </Btn>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Merge / split */}
      <Btn onClick={() => cmd(editor).mergeCells().run()} title="Merge selected cells">
        <Merge className="h-4 w-4" />
      </Btn>
      <Btn onClick={() => cmd(editor).splitCell().run()} title="Split cell">
        <Split className="h-4 w-4" />
      </Btn>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Cell background color */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="Cell background color"
            className="p-1.5 rounded transition-colors hover:bg-muted text-foreground"
          >
            <Paintbrush className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Fill cell(s)
          </p>
          <div className="grid grid-cols-6 gap-1 mb-2">
            {CELL_COLORS.map((c, i) => (
              <button
                key={i}
                type="button"
                title={c || 'Clear'}
                onClick={() => setCellBg(c)}
                className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform relative"
                style={{
                  backgroundColor: c || 'transparent',
                  backgroundImage: c
                    ? undefined
                    : 'linear-gradient(45deg, transparent 45%, hsl(var(--destructive)) 45%, hsl(var(--destructive)) 55%, transparent 55%)',
                }}
              />
            ))}
          </div>
          <input
            type="color"
            onChange={(e) => setCellBg(e.target.value)}
            className="w-full h-8 rounded cursor-pointer border border-border bg-transparent"
            title="Custom color"
          />
        </PopoverContent>
      </Popover>

      <div className="w-px h-5 bg-border mx-1" />

      <Btn onClick={() => cmd(editor).deleteTable().run()} title="Delete table">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Btn>
    </BubbleMenu>
  );
}
