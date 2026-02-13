"use client";

import {
  Bold,
  Italic,
  Underline,
  Link,
  AlignLeft,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect } from "react";

type TextEditorFieldProps = {
  content: string;
  setContent: (value: string) => void;
};

export function TextEditorField({ content, setContent }: TextEditorFieldProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      LinkExtension,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: content || "<p></p>",
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
  });

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const exec = (action: string) => {
    if (!editor) return;
    const chain = editor.chain().focus();

    switch (action) {
      case "bold":
        chain.toggleBold().run();
        break;
      case "italic":
        chain.toggleItalic().run();
        break;
      case "underline":
        chain.toggleUnderline().run();
        break;
      case "link":
        const url = window.prompt("Enter URL:");
        if (url) {
          chain.setLink({ href: url }).run();
        }
        break;
      case "alignLeft":
        chain.setTextAlign("left").run();
        break;
      case "bulletList":
        chain.toggleBulletList().run();
        break;
      case "orderedList":
        chain.toggleOrderedList().run();
        break;
      case "quote":
        chain.toggleBlockquote().run();
        break;
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-lg overflow-hidden border border-gray-300">
        <div
          className="w-full max-h-[380px] min-h-[300px] p-4 overflow-y-auto"
          onClick={() => editor?.chain().focus().run()}
        >
          <EditorContent
            editor={editor}
            className="prose prose-sm max-w-none focus:outline-none"
          />
        </div>
        <div className="border-t border-gray-300 bg-white p-2 flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => exec("bold")}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => exec("italic")}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => exec("underline")}
          >
            <Underline className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-gray-200 mx-1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => exec("link")}
          >
            <Link className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-gray-200 mx-1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => exec("alignLeft")}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-gray-200 mx-1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => exec("bulletList")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => exec("orderedList")}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-gray-200 mx-1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => exec("quote")}
          >
            <Quote className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
