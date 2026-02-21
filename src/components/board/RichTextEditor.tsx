'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    CheckSquare,
    Type,
    Code,
    Image as ImageIcon,
    Link as LinkIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) return null;

    return (
        <div className="flex flex-wrap gap-1 p-2 border-b border-white/5 bg-slate-900/50 sticky top-0 z-10 backdrop-blur-md">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn("icon-box w-8 h-8", editor.isActive('bold') && "bg-accent-1/20 text-accent-1 border-accent-1/30")}
            >
                <Bold size={14} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={cn("icon-box w-8 h-8", editor.isActive('italic') && "bg-accent-1/20 text-accent-1 border-accent-1/30")}
            >
                <Italic size={14} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={cn("icon-box w-8 h-8", editor.isActive('heading', { level: 2 }) && "bg-accent-1/20 text-accent-1 border-accent-1/30")}
            >
                <Type size={14} />
            </button>
            <div className="w-px h-6 bg-white/5 mx-1" />
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn("icon-box w-8 h-8", editor.isActive('bulletList') && "bg-accent-1/20 text-accent-1 border-accent-1/30")}
            >
                <List size={14} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={cn("icon-box w-8 h-8", editor.isActive('orderedList') && "bg-accent-1/20 text-accent-1 border-accent-1/30")}
            >
                <ListOrdered size={14} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                className={cn("icon-box w-8 h-8", editor.isActive('taskList') && "bg-accent-1/20 text-accent-1 border-accent-1/30")}
            >
                <CheckSquare size={14} />
            </button>
            <div className="w-px h-6 bg-white/5 mx-1" />
            <button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={cn("icon-box w-8 h-8", editor.isActive('blockquote') && "bg-accent-1/20 text-accent-1 border-accent-1/30")}
            >
                <Quote size={14} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={cn("icon-box w-8 h-8", editor.isActive('codeBlock') && "bg-accent-1/20 text-accent-1 border-accent-1/30")}
            >
                <Code size={14} />
            </button>
            <div className="w-px h-6 bg-white/5 mx-1" />
            <button
                onClick={() => editor.chain().focus().undo().run()}
                className="icon-box w-8 h-8"
            >
                <Undo size={14} />
            </button>
            <button
                onClick={() => editor.chain().focus().redo().run()}
                className="icon-box w-8 h-8"
            >
                <Redo size={14} />
            </button>
        </div>
    );
};

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({ openOnClick: false }),
            Image,
            Placeholder.configure({ placeholder: 'Start writing your project notes...' }),
            TaskList,
            TaskItem.configure({ nested: true }),
            Highlight,
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'tiptap focus:outline-none p-6 prose prose-invert max-w-none',
            },
        },
        immediatelyRender: false,
    });

    return (
        <div className="glass-panel border-white/5 overflow-hidden flex flex-col h-full bg-slate-950/20">
            <MenuBar editor={editor} />
            <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
