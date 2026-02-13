"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "../ui/textarea";
import Image from "next/image";
import {
  X,
  Paperclip,
  FileImage,
  FileText,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  FileAudio,
  FileVideo,
  Presentation,
  File,
  LucideIcon,
} from "lucide-react";
import { UploadedFile } from "./action-buttons";
import { motion, AnimatePresence } from "framer-motion";

interface ChatInputProps {
  message: string;
  setMessage: (message: string) => void;
  handleSubmit: (e: React.FormEvent, files?: File[]) => void;
  isLoading: boolean;
  placeholder: string;
  uploadedFiles?: UploadedFile[];
  setUploadedFiles?: (files: UploadedFile[]) => void;
}

// Helper function to determine file icon based on file type
function getFileIcon(fileType: string): LucideIcon {
  if (fileType.includes("image")) return FileImage;
  if (fileType.includes("pdf")) return File;
  if (fileType.includes("word") || fileType.includes("document"))
    return FileText;
  if (fileType.includes("excel") || fileType.includes("sheet"))
    return FileSpreadsheet;
  if (fileType.includes("csv")) return FileSpreadsheet;
  if (fileType.includes("text")) return FileText;
  if (
    fileType.includes("code") ||
    fileType.includes("json") ||
    fileType.includes("xml")
  )
    return FileCode;
  if (fileType.includes("zip") || fileType.includes("compressed"))
    return FileArchive;
  if (fileType.includes("audio")) return FileAudio;
  if (fileType.includes("video")) return FileVideo;
  if (fileType.includes("presentation") || fileType.includes("powerpoint"))
    return Presentation;
  return File; // Default icon
}

export function ChatInput({
  message,
  setMessage,
  handleSubmit,
  isLoading,
  placeholder,
  uploadedFiles = [],
  setUploadedFiles = () => {},
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the textarea when the component mounts
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  // Handle textarea height adjustment
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize the textarea based on content
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter((file) => file.id !== id));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || uploadedFiles.length > 0) {
      // Extract actual File objects from uploadedFiles
      const files = uploadedFiles.map((f) => f.file);
      handleSubmit(e, files.length > 0 ? files : undefined);
      // Clear uploaded files after submission
      setUploadedFiles([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: UploadedFile[] = Array.from(e.target.files).map(
        (file) => ({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type,
          file: file,
        })
      );

      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }

    // Clear the input value to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <form onSubmit={handleFormSubmit} className="w-full relative" autoComplete="off" >
      <div className="flex flex-col bg-white rounded-lg border border-[#e8ecef] shadow-sm max-w-2xl w-full mx-auto">
        {/* File attachments area */}
        <AnimatePresence>
          {uploadedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pt-3"
            >
              <div className="flex flex-wrap gap-2 mb-2">
                {uploadedFiles.map((file) => {
                  const FileIcon = getFileIcon(file.type);
                  return (
                    <div
                      key={file.id}
                      className="flex items-center gap-1.5 bg-blue-50 text-blue-700 rounded-full pl-2 pr-1 py-1 text-xs"
                    >
                      <FileIcon size={14} className="text-blue-600" />
                      <span className="max-w-[120px] truncate">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="h-4 w-4 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="h-px bg-gray-100 mb-2" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area */}
        <div className="flex items-end w-full px-3 pb-3 pt-2 gap-2">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            placeholder={
              uploadedFiles.length > 0
                ? "Add a message or send files..."
                : placeholder
            }
            className="flex-1 border border-gray-300 rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0 resize-none py-3 px-4 text-[#1a1a1a] min-h-[48px] max-h-[120px]"
            disabled={isLoading}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (message.trim() || uploadedFiles.length > 0) {
                  handleFormSubmit(e);
                }
              }
            }}
          />

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            multiple
          />

          <div className="flex items-end space-x-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="text-gray-500 hover:text-blue-600 hover:bg-gray-100 h-[40px] w-[40px]"
              disabled={isLoading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip size={18} />
            </Button>

            <Button
              type="submit"
              variant="ghost"
              className="text-black hover:text-blue-600 hover:bg-gray-100 h-[40px] w-[40px] p-0"
              disabled={
                isLoading || (!message.trim() && uploadedFiles.length === 0)
              }
            >
              <Image
                src="/assets/chat/submit.svg"
                alt="Send"
                width={24}
                height={24}
                className={isLoading ? "opacity-60" : ""}
              />
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
