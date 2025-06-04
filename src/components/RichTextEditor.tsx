'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import FontFamily from '@tiptap/extension-font-family';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  Type,
  Highlighter,
} from 'lucide-react';
import React from 'react';

const MenuBar = ({ editor, isQuickNote }: { editor: Editor | null; isQuickNote?: boolean }) => {
  if (!editor) {
    return null;
  }

  if (isQuickNote) {
    return (
      <div className="border-b p-2 flex flex-wrap gap-1 bg-[var(--muted)]">
        {/* Basic Text Formatting */}
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

        {/* History */}
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
  }

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="border-b p-2 flex flex-wrap gap-1 bg-[var(--muted)]">
      {/* Text Style Group */}
      <div className="flex items-center gap-1 border-r pr-2">
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
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-[var(--background)] ${
            editor.isActive('italic') ? 'bg-[var(--background)]' : ''
          }`}
          title="Italic"
        >
          <Italic size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-[var(--background)] ${
            editor.isActive('underline') ? 'bg-[var(--background)]' : ''
          }`}
          title="Underline"
        >
          <UnderlineIcon size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`p-2 rounded hover:bg-[var(--background)] ${
            editor.isActive('strike') ? 'bg-[var(--background)]' : ''
          }`}
          title="Strikethrough"
        >
          <Strikethrough size={18} />
        </button>
      </div>

      {/* Font Options */}
      <div className="flex items-center gap-1 border-r pr-2">
        <select
          onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
          className="h-8 px-2 rounded bg-[var(--background)] text-sm"
          value={editor.getAttributes('textStyle').fontFamily}
        >
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
        </select>
        <select
          onChange={(e) => {
            editor.chain().focus().setMark('textStyle', { fontSize: e.target.value }).run()
          }}
          className="h-8 px-2 rounded bg-[var(--background)] text-sm"
          value={editor.getAttributes('textStyle').fontSize || '16px'}
        >
          <option value="12px">Small</option>
          <option value="16px">Normal</option>
          <option value="20px">Large</option>
          <option value="24px">Heading 3</option>
        </select>
        <input
          type="color"
          onInput={(e) => {
            editor.chain().focus().setColor(e.currentTarget.value).run();
          }}
          value={editor.getAttributes('textStyle').color || '#000000'}
          className="w-8 h-8 p-1 rounded cursor-pointer"
          title="Text Color"
        />
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

      {/* Heading Group */}
      <div className="flex items-center gap-1 border-r pr-2">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-[var(--background)] ${
            editor.isActive('heading', { level: 1 }) ? 'bg-[var(--background)]' : ''
          }`}
          title="Heading 1"
        >
          <Heading1 size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-[var(--background)] ${
            editor.isActive('heading', { level: 2 }) ? 'bg-[var(--background)]' : ''
          }`}
          title="Heading 2"
        >
          <Heading2 size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`p-2 rounded hover:bg-[var(--background)] ${
            editor.isActive('paragraph') ? 'bg-[var(--background)]' : ''
          }`}
          title="Normal Text"
        >
          <Type size={18} />
        </button>
      </div>

      {/* Alignment Group */}
      <div className="flex items-center gap-1 border-r pr-2">
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded hover:bg-[var(--background)] ${
            editor.isActive({ textAlign: 'left' }) ? 'bg-[var(--background)]' : ''
          }`}
          title="Align Left"
        >
          <AlignLeft size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded hover:bg-[var(--background)] ${
            editor.isActive({ textAlign: 'center' }) ? 'bg-[var(--background)]' : ''
          }`}
          title="Align Center"
        >
          <AlignCenter size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded hover:bg-[var(--background)] ${
            editor.isActive({ textAlign: 'right' }) ? 'bg-[var(--background)]' : ''
          }`}
          title="Align Right"
        >
          <AlignRight size={18} />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`p-2 rounded hover:bg-[var(--background)] ${
            editor.isActive({ textAlign: 'justify' }) ? 'bg-[var(--background)]' : ''
          }`}
          title="Justify"
        >
          <AlignJustify size={18} />
        </button>
      </div>

      {/* List Group */}
      <div className="flex items-center gap-1 border-r pr-2">
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
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-[var(--background)] ${
            editor.isActive('blockquote') ? 'bg-[var(--background)]' : ''
          }`}
          title="Quote"
        >
          <Quote size={18} />
        </button>
      </div>

      {/* Insert Group */}
      <div className="flex items-center gap-1 border-r pr-2">
        <button
          onClick={addLink}
          className={`p-2 rounded hover:bg-[var(--background)] ${
            editor.isActive('link') ? 'bg-[var(--background)]' : ''
          }`}
          title="Insert Link"
        >
          <LinkIcon size={18} />
        </button>
        <button
          onClick={addImage}
          className="p-2 rounded hover:bg-[var(--background)]"
          title="Insert Image"
        >
          <ImageIcon size={18} />
        </button>
      </div>

      {/* History Group */}
      <div className="flex items-center gap-1">
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
  isQuickNote?: boolean;
}

export function RichTextEditor({ content, onChange, placeholder, isQuickNote }: RichTextEditorProps) {
  console.log('RichTextEditor rendering with content length:', content ? content.length : 0);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
          HTMLAttributes: {
            class: 'heading',  // Base class for headings
          },
        },
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
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-gray-300 pl-4 italic',
          },
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write something...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80 transition-colors',
        },
        validate: url => /^https?:\/\//.test(url),
      }),
      Underline,
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg border border-gray-200',
        },
      }),
      FontFamily.configure({
        types: ['textStyle'],
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
      <MenuBar editor={editor} isQuickNote={isQuickNote} />
      <EditorContent 
        editor={editor} 
        className="flex-1 p-4 overflow-y-auto [&_h1]:text-3xl [&_h1]:font-extrabold [&_h2]:text-xl [&_h2]:font-bold [&_p]:text-base"
      />
    </div>
  );
}