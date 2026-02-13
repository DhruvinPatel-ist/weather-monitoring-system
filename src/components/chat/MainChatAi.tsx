/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import useChat from "@/hooks/useChat";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { LoadingIndicator } from "@/components/chat/loading-indicator";
import { UploadedFile } from "@/components/chat/action-buttons";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getCookie } from "@/utils/cookies";
import { Message } from "@/hooks/useChat";
import { ChatHistoryLoading } from "./chat-history-loading";
import { removeCookie } from "@/utils/cookies";

const API_BASE = process.env.NEXT_PUBLIC_API_AI_BASE_URL;

export default function MainChatAi() {
  // Handler to paginate a specific AI message (uses fetchAIResponse and setMessages from useChat)
  const handlePaginate = async (msgIndex: number, page: number, pageSize: number) => {
    // Find the user message before this AI message
    const userMsgIndex = (() => {
      for (let i = msgIndex - 1; i >= 0; i--) {
        if (messages[i]?.role === "user") return i;
      }
      return -1;
    })();
    if (userMsgIndex === -1) return;
    const userMsg = messages[userMsgIndex];
    const aiMsg = messages[msgIndex];
    // Use documentId if available (from aiMsg or global)
      const docId = aiMsg?.results?.[0]?.document_id || null;
    // Call fetchAIResponse and update only this AI message (do not update state inside fetchAIResponse)
    const res = await fetchAIResponse(userMsg.content, docId, page, pageSize, false);
    // Replace only the AI message at msgIndex with the new response
    setMessages((prev) => {
      const updated = [...prev];
      if (res && Array.isArray(res.messages) && res.messages.length > 0) {
        updated[msgIndex] = res.messages[0];
      }
      return updated;
    });
  };
  const t = useTranslations("ChatAI");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const {
    message,
    setMessage,
    messages,
    setMessages,
    isLoading,
    handleSubmit,
    handleSubmitWithFiles,
    resetChat,
    messagesEndRef,
    setDocumentId,
    fetchAIResponse,
  } = useChat();

  useEffect(() => {
    const fetchRecentChats = async () => {
      const sessionId = getCookie("chat_session_id");

      if (!sessionId) {
        setIsLoadingHistory(false);
        return;
      }

      try {
        setIsLoadingHistory(true);
        setHistoryError(null);

        const response = await fetch(`${API_BASE}session/${sessionId}`, {
          method: "GET",
        });

        if (!response.ok) throw new Error("Failed to fetch session messages");

        const data = await response.json();

        if (
          data.recent_conversations &&
          Array.isArray(data.recent_conversations)
        ) {
          const formattedMessages: Message[] = [];

          data.recent_conversations.forEach((conversation: any) => {
            // Add user message
            formattedMessages.push({
              role: "user",
              content: conversation.question,
              timestamp: formatTimestamp(conversation.timestamp),
            });

            // Add assistant response
            formattedMessages.push({
              role: "assistant",
              content: conversation.answer,
              timestamp: formatTimestamp(conversation.timestamp),
              results: conversation.data_sources || [],
            });
          });

          setMessages(formattedMessages);
        } else if (Array.isArray(data.messages)) {
          // Fallback to the old format if it exists
          const formattedMessages = data.messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            results: msg.results || [],
          }));
          setMessages(formattedMessages);
        } else {
          console.warn("No conversations found in session data:", data);
        }
      } catch (err) {
        console.error("Session fetch failed:", err);
        setHistoryError("Failed to load chat history");
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchRecentChats();
  }, [setMessages]);

  // Format timestamp only on client to avoid hydration mismatch
  const formatTimestamp = (timestamp: string) => {
    if (typeof window === 'undefined') return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  // Modified submit handler to include files
  const handleFormSubmit = (e: React.FormEvent, files?: File[]) => {
    if (handleSubmitWithFiles) {
      handleSubmitWithFiles(e, files);
    } else {
      handleSubmit(e);
    }
  };

  // Show loading screen while fetching chat history
  if (isLoadingHistory) {
    return <ChatHistoryLoading />;
  }

  return (
    <div
      className="flex flex-col items-center justify-center h-full bg-gray1"
      dir="ltr"
    >
      <div className="flex flex-col w-full h-full max-w-full mx-auto">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center flex-grow px-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 mb-2"
            >
              <h1
                className="text-3xl font-bold text-[#1a1a1a] bg-gradient-to-r from-blue1 to-blue-600 bg-clip-text"
                dir="ltr"
              >
                Chat AI
              </h1>
              <Image
                src="/assets/chat/AI.svg"
                alt="Logo"
                width={30}
                height={30}
                className="drop-shadow-sm"
              />
            </motion.div>
            <h2
              className="text-2xl font-medium text-[#1a1a1a] mb-8 text-center"
              dir="ltr"
            >
              Good day! How may I assist you today?
            </h2>
            <div className="w-full max-w-3xl" dir="ltr">
              <ChatInput
                message={message}
                setMessage={setMessage}
                handleSubmit={handleFormSubmit}
                isLoading={isLoading}
                placeholder="What's on your mind?"
                uploadedFiles={uploadedFiles}
                setUploadedFiles={setUploadedFiles}
              />
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col flex-grow w-full px-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3 sticky top-0 z-10 py-3 bg-gray1 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Image
                  src="/assets/chat/AI.svg"
                  alt="AI"
                  width={20}
                  height={20}
                  className="object-contain"
                />
                <h3 className="font-medium text-[#1a1a1a]">{t("Chat AI")}</h3>
              </div>
              <Button
                variant="outline"
                className="bg-white text-blue1 hover:bg-blue-50 border border-blue1 rounded-full px-4 py-2 flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow"
                onClick={() => {
                  resetChat();
                  setDocumentId?.(null);
                  removeCookie("chat_session_id");
                }}
              >
                <Image
                  src="/assets/chat/NewChat.svg"
                  alt="logo"
                  width={18}
                  height={18}
                />
                New Chat
              </Button>
            </div>
            <div className="flex-grow overflow-y-auto pr-2 mb-4 custom-scrollbar">
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <ChatMessage
                    message={msg}
                    isLastMessage={index === messages.length - 1}
                    onPaginate={(page, pageSize) => handlePaginate(index, page, pageSize)}
                  />
                </motion.div>
              ))}
              {isLoading && <LoadingIndicator />}
              <div ref={messagesEndRef} />
            </div>
            <div className="mt-auto sticky bottom-0 bg-gray1 pt-2 pb-4">
              <ChatInput
                message={message}
                setMessage={setMessage}
                handleSubmit={handleFormSubmit}
                isLoading={isLoading}
                placeholder={t("Ask now!")}
                uploadedFiles={uploadedFiles}
                setUploadedFiles={setUploadedFiles}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
