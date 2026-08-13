import { useState, useCallback, useEffect, useReducer } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Image as ImageIcon, Link as LinkIcon, Youtube as YoutubeIcon,
  Quote, Code, Minus, Undo, Redo, Type,
  Palette, PaintBucket, Table as TableIcon, Columns, Trash2,
  ArrowLeftRight, ArrowUpDown, CaseSensitive,
} from 'lucide-react';

const FONT_FAMILIES = [
  { label: 'Default', value: '' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Open Sans', value: '"Open Sans", sans-serif' },
  { label: 'Lato', value: 'Lato, sans-serif' },
  { label: 'Montserrat', value: 'Montserrat, sans-serif' },
  { label: 'Poppins', value: 'Poppins, sans-serif' },
  { label: 'Nunito', value: 'Nunito, sans-serif' },
  { label: 'Raleway', value: 'Raleway, sans-serif' },
  { label: 'Source Sans 3', value: '"Source Sans 3", sans-serif' },
  { label: 'Merriweather', value: 'Merriweather, serif' },
  { label: 'Playfair Display', value: '"Playfair Display", serif' },
  { label: 'Lora', value: 'Lora, serif' },
  { label: 'PT Serif', value: '"PT Serif", serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { label: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
  { label: 'Fira Code', value: '"Fira Code", monospace' },
];

interface EditorToolbarProps {
  editor: Editor;
  showYoutube?: boolean;
}

const TEXT_COLORS = [
  '#000000', '#1F2937', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6', '#FFFFFF',
  '#7F1D1D', '#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#FEE2E2', '#FEF2F2',
  '#7C2D12', '#EA580C', '#F97316', '#FB923C', '#FDBA74', '#FED7AA', '#FFEDD5', '#FFF7ED',
  '#78350F', '#D97706', '#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A', '#FEF3C7', '#FFFBEB',
  '#14532D', '#16A34A', '#22C55E', '#4ADE80', '#86EFAC', '#BBF7D0', '#DCFCE7', '#F0FDF4',
  '#134E4A', '#0D9488', '#14B8A6', '#2DD4BF', '#5EEAD4', '#99F6E4', '#CCFBF1', '#F0FDFA',
  '#1E3A8A', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE', '#EFF6FF',
  '#312E81', '#4F46E5', '#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE', '#E0E7FF', '#EEF2FF',
  '#581C87', '#9333EA', '#A855F7', '#C084FC', '#D8B4FE', '#E9D5FF', '#F3E8FF', '#FAF5FF',
  '#831843', '#DB2777', '#EC4899', '#F472B6', '#F9A8D4', '#FBCFE8', '#FCE7F3', '#FDF2F8',
];

const HIGHLIGHT_COLORS = [
  '#FEF3C7', '#FEF08A', '#FDE68A', '#FCD34D',
  '#D9F99D', '#BBF7D0', '#BEF264', '#86EFAC',
  '#A5F3FC', '#BFDBFE', '#A7F3D0', '#7DD3FC',
  '#DDD6FE', '#E9D5FF', '#FBCFE8', '#FECACA',
  '#FED7AA', '#FECDD3', '#FCA5A5', '#F9A8D4',
  '#E5E7EB', '#D1D5DB', '#9CA3AF', '#FFFFFF',
];

const IMAGE_FLOAT_OPTIONS = [
  { label: 'Inline', value: 'none' },
  { label: 'Float Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Float Right', value: 'right' },
];

const IMAGE_WIDTH_OPTIONS = ['25%', '33%', '50%', '75%', '100%'];

// Helper to call editor commands that may come from extensions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cmd = (editor: Editor) => editor.chain().focus() as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const can = (editor: Editor) => editor.can() as any;

export default function EditorToolbar({ editor, showYoutube = false }: EditorToolbarProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageFloat, setImageFloat] = useState('none');
  const [imageWidth, setImageWidth] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);

  // Force re-render whenever editor selection or content changes so toolbar
  // conditionals (delete column, delete shape, active states) stay in sync.
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    if (!editor) return;
    const handler = () => forceUpdate();
    editor.on('selectionUpdate', handler);
    editor.on('transaction', handler);
    editor.on('focus', handler);
    editor.on('blur', handler);
    return () => {
      editor.off('selectionUpdate', handler);
      editor.off('transaction', handler);
      editor.off('focus', handler);
      editor.off('blur', handler);
    };
  }, [editor]);

  const addLink = useCallback(() => {
    if (!linkUrl) return;
    editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    setLinkUrl('');
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (!imageUrl) return;
    const attrs: Record<string, string> = { src: imageUrl };
    if (imageFloat && imageFloat !== 'none') attrs.float = imageFloat;
    if (imageWidth) attrs.width = imageWidth;
    cmd(editor).setImage(attrs).run();
    setImageUrl('');
    setImageFloat('none');
    setImageWidth('');
    setShowImageInput(false);
  }, [editor, imageUrl, imageFloat, imageWidth]);

  const addYoutube = useCallback(() => {
    if (!youtubeUrl) return;
    cmd(editor).setYoutubeVideo({ src: youtubeUrl }).run();
    setYoutubeUrl('');
    setShowYoutubeInput(false);
  }, [editor, youtubeUrl]);

  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  const insertTable = useCallback((rows = 3, cols = 3) => {
    cmd(editor)
      .insertTable({ rows, cols, withHeaderRow: true })
      .run();
  }, [editor]);

  const insertColumns = useCallback((cols: number) => {
    cmd(editor).insertColumns(cols).run();
  }, [editor]);

  const ToolBtn = ({ onClick, active, children, title }: {
    onClick: () => void; active?: boolean; children: React.ReactNode; title?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded hover:bg-muted transition-colors ${active ? 'bg-muted text-primary' : 'text-muted-foreground'}`}
    >
      {children}
    </button>
  );

  return (
    <div>
      {/* Main toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/30 sticky top-0 z-10">
        {/* Text formatting */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <Bold className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <Italic className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
          <UnderlineIcon className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough className="h-4 w-4" />
        </ToolBtn>

        {/* Text Color */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" title="Text Color" className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground relative">
              <Palette className="h-4 w-4" />
              {editor.getAttributes('textStyle').color && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded" style={{ backgroundColor: editor.getAttributes('textStyle').color }} />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <p className="text-xs font-medium mb-2 text-muted-foreground">Text Color</p>
            <div className="grid grid-cols-8 gap-1 mb-3">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  className="w-5 h-5 rounded border border-border hover:scale-125 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => cmd(editor).setColor(color).run()}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-muted-foreground flex-1">Custom:</label>
              <input
                type="color"
                onChange={(e) => cmd(editor).setColor(e.target.value).run()}
                className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-xs"
              onClick={() => cmd(editor).unsetColor().run()}
            >
              Clear color
            </Button>
          </PopoverContent>
        </Popover>

        {/* Highlight / Fill Color */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" title="Fill / Highlight Color" className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground">
              <PaintBucket className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <p className="text-xs font-medium mb-2 text-muted-foreground">Highlight Color</p>
            <div className="grid grid-cols-8 gap-1 mb-3">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  className="w-5 h-5 rounded border border-border hover:scale-125 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => cmd(editor).toggleHighlight({ color }).run()}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-muted-foreground flex-1">Custom:</label>
              <input
                type="color"
                onChange={(e) => cmd(editor).toggleHighlight({ color: e.target.value }).run()}
                className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-xs"
              onClick={() => cmd(editor).unsetHighlight().run()}
            >
              Clear highlight
            </Button>
          </PopoverContent>
        </Popover>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Headings */}
        <ToolBtn onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')} title="Paragraph">
          <Type className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 className="h-4 w-4" />
        </ToolBtn>

        {/* Font Family */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" title="Font Family" className="px-2 py-1.5 rounded hover:bg-muted transition-colors text-muted-foreground flex items-center gap-1 text-xs">
              <CaseSensitive className="h-4 w-4" />
              <span className="hidden md:inline max-w-[80px] truncate">
                {FONT_FAMILIES.find(f => f.value === (editor.getAttributes('textStyle').fontFamily || ''))?.label || 'Font'}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-1 max-h-72 overflow-y-auto" align="start">
            {FONT_FAMILIES.map((f) => (
              <button
                key={f.label}
                type="button"
                className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors"
                style={{ fontFamily: f.value || undefined }}
                onClick={() => {
                  if (f.value) cmd(editor).setFontFamily(f.value).run();
                  else cmd(editor).unsetFontFamily().run();
                }}
              >
                {f.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Lists & blocks */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
          <List className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List">
          <ListOrdered className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
          <Quote className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
          <Code className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
          <Minus className="h-4 w-4" />
        </ToolBtn>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Alignment */}
        <ToolBtn onClick={() => cmd(editor).setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
          <AlignLeft className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => cmd(editor).setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
          <AlignCenter className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => cmd(editor).setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
          <AlignRight className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => cmd(editor).setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
          <AlignJustify className="h-4 w-4" />
        </ToolBtn>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Table — custom rows/cols */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" title="Insert Table" className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground">
              <TableIcon className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3 space-y-2" align="start">
            <p className="text-xs font-medium text-muted-foreground">Insert Table</p>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground w-12">Rows</label>
              <Input
                type="number"
                min={1}
                max={50}
                value={tableRows}
                onChange={(e) => setTableRows(Math.max(1, Math.min(50, parseInt(e.target.value || '1', 10))))}
                className="h-7 text-xs flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground w-12">Cols</label>
              <Input
                type="number"
                min={1}
                max={20}
                value={tableCols}
                onChange={(e) => setTableCols(Math.max(1, Math.min(20, parseInt(e.target.value || '1', 10))))}
                className="h-7 text-xs flex-1"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs h-7"
              onClick={() => insertTable(tableRows, tableCols)}
            >
              Insert {tableRows}×{tableCols} Table
            </Button>
            <p className="text-[10px] text-muted-foreground pt-1 border-t">
              Tip: Click inside a table to access merge, split, fill color and more.
            </p>
          </PopoverContent>
        </Popover>

        {/* Multi-column */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" title="Multi-column Layout" className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground">
              <Columns className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <p className="text-xs font-medium text-muted-foreground mb-1">Column Layout</p>
            <div className="flex gap-1">
              {[2, 3, 4, 5, 6].map((n) => (
                <Button key={n} size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => insertColumns(n)}>
                  {n}
                </Button>
              ))}
            </div>
            {(editor.isActive('columns') || editor.isActive('column')) && (
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs h-7 mt-2 text-destructive hover:text-destructive"
                onClick={() => cmd(editor).deleteColumns().run()}
              >
                <Trash2 className="h-3 w-3 mr-1" /> Delete Column Layout
              </Button>
            )}
          </PopoverContent>
        </Popover>

        {(editor.isActive('columns') || editor.isActive('column')) && (
          <ToolBtn
            onClick={() => cmd(editor).deleteColumns().run()}
            title="Delete Column Layout"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </ToolBtn>
        )}

        <div className="w-px h-5 bg-border mx-1" />

        {/* Links & media */}
        <ToolBtn onClick={() => setShowLinkInput(!showLinkInput)} active={editor.isActive('link')} title="Insert Link">
          <LinkIcon className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => setShowImageInput(!showImageInput)} title="Insert Image">
          <ImageIcon className="h-4 w-4" />
        </ToolBtn>
        {showYoutube && (
          <ToolBtn onClick={() => setShowYoutubeInput(!showYoutubeInput)} title="Embed YouTube">
            <YoutubeIcon className="h-4 w-4" />
          </ToolBtn>
        )}

        <div className="w-px h-5 bg-border mx-1" />

        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo className="h-4 w-4" />
        </ToolBtn>
      </div>

      {/* Inline inputs */}
      {showLinkInput && (
        <div className="flex items-center gap-2 p-2 border-b bg-muted/20">
          <Input placeholder="https://example.com" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="flex-1 h-8 text-sm" onKeyDown={(e) => e.key === 'Enter' && addLink()} />
          <Button size="sm" variant="outline" onClick={addLink} className="h-8">Add Link</Button>
          {editor.isActive('link') && (
            <Button size="sm" variant="ghost" onClick={() => { editor.chain().focus().unsetLink().run(); setShowLinkInput(false); }} className="h-8">Remove</Button>
          )}
        </div>
      )}
      {showImageInput && (
        <div className="flex flex-col gap-2 p-2 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <Input placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="flex-1 h-8 text-sm" onKeyDown={(e) => e.key === 'Enter' && addImage()} />
            <Button size="sm" variant="outline" onClick={addImage} className="h-8">Add Image</Button>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground font-medium">Float:</span>
            {IMAGE_FLOAT_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="img-float"
                  value={opt.value}
                  checked={imageFloat === opt.value}
                  onChange={() => setImageFloat(opt.value)}
                  className="w-3 h-3"
                />
                {opt.label}
              </label>
            ))}
            <span className="text-muted-foreground font-medium ml-2">Width:</span>
            <select
              value={imageWidth}
              onChange={(e) => setImageWidth(e.target.value)}
              className="h-7 text-xs rounded border border-input bg-background px-1.5"
            >
              <option value="">Auto</option>
              {IMAGE_WIDTH_OPTIONS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      {showYoutube && showYoutubeInput && (
        <div className="flex items-center gap-2 p-2 border-b bg-muted/20">
          <Input placeholder="YouTube URL" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="flex-1 h-8 text-sm" onKeyDown={(e) => e.key === 'Enter' && addYoutube()} />
          <Button size="sm" variant="outline" onClick={addYoutube} className="h-8">Embed</Button>
        </div>
      )}
    </div>
  );
}
