import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontFamily } from "@tiptap/extension-font-family";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import { FloatingImage } from "./editor/FloatingImage";
import { ColoredTableCell, ColoredTableHeader } from "./editor/ColoredTableCell";
import { Columns, Column } from "./editor/Columns";

import EditorToolbar from "./editor/EditorToolbar";
import ImageBubbleMenu from "./editor/ImageBubbleMenu";
import TableBubbleMenu from "./editor/TableBubbleMenu";
import { useEffect } from "react";

interface ResourceEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function ResourceEditor({ content, onChange }: ResourceEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline as any,
      TextStyle as any,
      FontFamily as any,
      Color as any,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }),
      FloatingImage.configure({ inline: true, allowBase64: true }),
      TextAlign.configure({ types: ["heading", "paragraph", "image"] }),
      Placeholder.configure({ placeholder: "Write resource content here…" }),
      Youtube.configure({ width: 640, height: 360 }),
      Table.configure({ resizable: true, allowTableNodeSelection: true }),
      TableRow,
      ColoredTableCell,
      ColoredTableHeader,
      Columns,
      Column,
    ],
    content,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "", { emitUpdate: false });
    }
  }, [content]);

  if (!editor) return null;

  return (
    <div className="border rounded-lg overflow-hidden bg-background flex flex-col">
      <EditorToolbar editor={editor} showYoutube />
      <ImageBubbleMenu editor={editor} />
      <TableBubbleMenu editor={editor} />
      <EditorContent editor={editor} className="tiptap-editor prose prose-sm max-w-none p-4 h-[400px] overflow-y-auto focus:outline-none [&_.tiptap]:outline-none [&_.tiptap]:min-h-full [&_.ProseMirror]:break-words [&_.ProseMirror]:[overflow-wrap:anywhere] [&_.ProseMirror]:whitespace-pre-wrap" />
    </div>
  );
}
