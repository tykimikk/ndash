'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import {
  Bold,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Highlighter,
} from 'lucide-react';
import React from 'react';

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b p-2 flex flex-wrap gap-1 bg-[var(--muted)]">
      {/* Essential Text Formatting */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-[var(--background)] ${
            editor.isActive('bold') ? 'bg-[var(--background)]' : ''
          }`}
          title="Bold"
        >
          <Bold size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`p-2 rounded hover:bg-[var(--background)] ${
            editor.isActive('highlight') ? 'bg-[var(--background)]' : ''
          }`}
          title="Highlight"
        >
          <Highlighter size={18} />
        </button>
      </div>

      {/* Lists */}
      <div className="flex items-center gap-1 border-l pl-2">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-[var(--background)] ${
            editor.isActive('bulletList') ? 'bg-[var(--background)]' : ''
          }`}
          title="Bullet List"
        >
          <List size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-[var(--background)] ${
            editor.isActive('orderedList') ? 'bg-[var(--background)]' : ''
          }`}
          title="Numbered List"
        >
          <ListOrdered size={18} />
        </button>
      </div>

      {/* Undo/Redo */}
      <div className="flex items-center gap-1 border-l pl-2">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-2 rounded hover:bg-[var(--background)]"
          title="Undo"
        >
          <Undo2 size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-2 rounded hover:bg-[var(--background)]"
          title="Redo"
        >
          <Redo2 size={18} />
        </button>
      </div>
    </div>
  );
};

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  console.log('RichTextEditor rendering with content length:', content ? content.length : 0);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable headings
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'list-disc pl-4',
          },
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'list-decimal pl-4',
          },
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write something...',
      }),
      TextStyle,
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'bg-yellow-200 dark:bg-yellow-800',
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      console.log('Editor updated, new content length:', html.length);
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[150px]',
      },
    },
  });
  
  // Update editor content when the content prop changes
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      console.log('Content prop changed, updating editor content');
      console.log('New content length:', content ? content.length : 0);
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  return (
    <div className="w-full h-full flex flex-col rounded-md overflow-hidden bg-[var(--background)]">
      <MenuBar editor={editor} />
      <EditorContent 
        editor={editor} 
        className="flex-1 p-4 overflow-y-auto [&_h1]:text-3xl [&_h1]:font-extrabold [&_h2]:text-xl [&_h2]:font-bold [&_p]:text-base"
      />
    </div>
  );
}