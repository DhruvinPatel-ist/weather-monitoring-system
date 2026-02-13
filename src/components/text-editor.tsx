"use client";

import {
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  AlignLeft,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

type TextEditorProps = {
  placeholder?: string;
  className?: string;
  content?: string; // HTML string to preload
  onChange: (value: { title: string; description: string }) => void;
};

export function TextEditor({
  placeholder = "Enter your note here...",
  className,
  content,
  onChange,
}: TextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Default StarterKit extensions.
        // If you need specific code block highlighting, consider CodeBlockLowlight
        // For basic code blocks, StarterKit's default is fine.
        // codeBlock: {}, // No specific configuration needed here unless you're customizing it.
      }),
      UnderlineExtension,
      // Configure Link extension for new tab and autolinking
      Link.configure({
        openOnClick: false, // Important: Allows clicking the button to edit/unset link
        autolink: true, // Automatically converts typed URLs into links
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: content || "<p></p>",
    onUpdate: ({ editor }) => {
      // Get the raw text content
      const text = editor.getText();

      // Split by newlines to separate lines
      const lines = text.split("\n");

      // First non-empty line is the title
      let title = "";
      const descriptionLines: string[] = [];

      let foundTitle = false;

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!foundTitle && trimmedLine) {
          // First non-empty line becomes the title
          title = trimmedLine;
          foundTitle = true;
        } else if (foundTitle) {
          // All subsequent lines go to description
          descriptionLines.push(line);
        }
      }

      // Join description lines back together
      const description = descriptionLines.join("\n");

      onChange({ title, description });
    },
  });

  // If content is changed externally (e.g., editing a new note), reset editor content
  useEffect(() => {
    if (editor && content !== undefined && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const exec = (action: string) => {
    if (!editor) return;
    const chain = editor.chain().focus(); // Always focus the editor when an action is performed

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
        const url = window.prompt("Enter the URL:");

        // If the user cancels the prompt
        if (url === null) {
          return;
        }

        // If the user clears the input or enters an empty string, unset the link
        if (url === "") {
          chain.unsetLink().run();
          return;
        }

        // Otherwise, set the link
        chain.setLink({ href: url, target: "_blank" }).run();
        break;
      case "alignLeft":
        chain.setTextAlign("left").run();
        break;
      // You can add more alignment options if needed:
      // case "alignCenter":
      //   chain.setTextAlign("center").run();
      //   break;
      // case "alignRight":
      //   chain.setTextAlign("right").run();
      //   break;
      // case "alignJustify":
      //   chain.setTextAlign("justify").run();
      //   break;
      case "bulletList":
        chain.toggleBulletList().run();
        break;
      case "orderedList":
        chain.toggleOrderedList().run();
        break;
      case "quote":
        chain.toggleBlockquote().run();
        break;
      // Add other actions as needed
      default:
        // Optional: Log an error for unknown actions
        console.warn(`Unknown action: ${action}`);
        break;
    }
  };

  return (
    <div className={cn("w-full space-y-2 bg-white1 rounded-md", className)}>
      <div className="rounded-lg overflow-hidden bg-white border border-gray-300">
        {/* Editor Scrollable Area */}
        <div
          className="relative h-[400px] overflow-y-auto p-4"
          // Clicking on the scrollable area should focus the editor
          onClick={() => {
            editor?.chain().focus().run();
          }}
        >
          {editor && (
            <EditorContent
              editor={editor}
              className={cn(
                "prose prose-sm sm:prose lg:prose-lg xl:prose-xl w-full",
                "focus:outline-none overflow-x-auto break-all whitespace-pre-wrap hide-scrollbar",
                // Placeholder styling
                "is-editor-empty:before:content-[attr(data-placeholder)]",
                "is-editor-empty:before:text-gray-400",
                "is-editor-empty:before:absolute",
                "is-editor-empty:before:top-4",
                "is-editor-empty:before:left-4",
                "is-editor-empty:before:pointer-events-none"
              )}
              data-placeholder={placeholder} // Pass placeholder to data-attribute for CSS
            />
          )}
        </div>

        {/* Toolbar */}
        <div className="border-t bg-white p-2 flex items-center gap-2 flex-wrap">
          {[
            { icon: <Bold className="h-4 w-4" />, action: "bold" },
            { icon: <Italic className="h-4 w-4" />, action: "italic" },
            { icon: <Underline className="h-4 w-4" />, action: "underline" },
            null, // Divider
            { icon: <LinkIcon className="h-4 w-4" />, action: "link" }, // Link button with 'link' action
            null, // Divider
            { icon: <AlignLeft className="h-4 w-4" />, action: "alignLeft" },
            // Add buttons for other alignment options here if you implement them in exec
            null, // Divider
            { icon: <List className="h-4 w-4" />, action: "bulletList" },
            {
              icon: <ListOrdered className="h-4 w-4" />,
              action: "orderedList",
            },
            null, // Divider
            { icon: <Quote className="h-4 w-4" />, action: "quote" },
          ].map((item, index) =>
            item ? (
              <Button
                key={index}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => item.action && exec(item.action)}
                // Optionally add an 'isActive' class based on editor state
                // className={editor?.isActive(item.action) ? "is-active" : ""}
              >
                {item.icon}
              </Button>
            ) : (
              <div key={index} className="h-6 w-px bg-gray-200 mx-1" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
