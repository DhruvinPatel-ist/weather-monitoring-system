// Add or update the useChat hook with proper timestamp handling and message management
import { useState, useRef, useCallback } from "react";
import { getCookie, setCookie } from "@/utils/cookies";

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  results?: any[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_AI_BASE_URL || "";

export default function useChat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string>(""); // adjust path accordingly

  const SESSION_COOKIE_NAME = "chat_session_id";

  // Enhanced session fetch with cookie handling
  const getOrCreateSessionId = useCallback(async (): Promise<string> => {
    let sessionId = getCookie(SESSION_COOKIE_NAME) || "";
    if (!sessionId) {
      const response = await fetch(`${API_BASE}session/new`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to get session id");
      const data = await response.json();
      sessionId = data.session_id;
      setCookie(SESSION_COOKIE_NAME, sessionId);
    }
    return sessionId;
  }, []);
  const formatTimestamp = useCallback(() => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  // Upload file and get document_id
  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE}upload-and-process`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("File upload failed");
    }
    const data = await response.json();
    return data.document_id as string;
  };

  // Chat with or without document_id
  const fetchAIResponse = useCallback(
    async (
      userQuery: string,
      docId?: string,
      page: number = 1,
      pageSize: number = 100,
      updateState: boolean = true
    ) => {
      setIsLoading(true);
      try {
        const sessionId = await getOrCreateSessionId();
        const body: any = {
          question: userQuery,
          session_id: sessionId,
          document_id: docId || "",
          use_database: true,
          use_documents: true,
          auto_correct: true,
          analysis_type: "auto",
          max_db_rows: 100000,
          page,
          page_size: pageSize,
        };

        const response = await fetch(`${API_BASE}enhanced-chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!response.ok) throw new Error(`Server error (${response.status})`);
        const data = await response.json();
        const newMessage: Message = {
          role: "assistant",
          content:
            data.answer || data.message || "I couldn't process your query.",
          timestamp: formatTimestamp(),
          results: data.results,
        };
        if (updateState) {
          setMessages((prev) => [
            ...prev,
            newMessage,
          ]);
          scrollToBottom();
        }
        // For pagination, return the new message so parent can update only that message
        return { messages: [newMessage] };
      } catch (error) {
        const errorMessage: Message = {
          role: "assistant",
          content: `Sorry, error occurred: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          timestamp: formatTimestamp(),
        };
        if (updateState) {
          setMessages((prev) => [
            ...prev,
            errorMessage,
          ]);
          scrollToBottom();
        }
        return { messages: [errorMessage] };
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [getOrCreateSessionId, formatTimestamp, scrollToBottom]
  );

  // Submit handler for chat (with or without document)
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!message.trim() || isLoading) return;

      lastUserMessageRef.current = message.trim();
      setMessages((prev) => [
        ...prev,
        { role: "user", content: message, timestamp: formatTimestamp() },
      ]);
      setMessage("");
      scrollToBottom();
      await fetchAIResponse(
        lastUserMessageRef.current,
        documentId || undefined
      );
    },
    [
      message,
      isLoading,
      formatTimestamp,
      scrollToBottom,
      fetchAIResponse,
      documentId,
    ]
  );

  // Submit handler for chat with files
  const handleSubmitWithFiles = async (e: React.FormEvent, files?: File[]) => {
    e.preventDefault();
    if (!message.trim() && (!files || files.length === 0)) return;

    lastUserMessageRef.current = message.trim();
    setMessages((prev) => [
      ...prev,
      { role: "user", content: message, timestamp: formatTimestamp() },
    ]);
    setMessage("");
    setIsLoading(true);

    let docId = documentId;
    try {
      if (files && files.length > 0) {
        // Only upload the first file for now (API supports one file per chat)
        docId = await uploadFile(files[0]);
        setDocumentId(docId);
      }
      await fetchAIResponse(lastUserMessageRef.current, docId || undefined);
    } catch (error) {
      console.log("File upload error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, file upload failed. Please try again.",
          timestamp: formatTimestamp(),
        },
      ]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  // Completely clear chat/session data for current user (used on logout)
  const clearUserSession = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setMessages([]);
    setIsLoading(false);
    setRetryCount(0);
    setDocumentId(null);
    lastUserMessageRef.current = "";
    // Remove session cookie for chat
    if (typeof window !== "undefined") {
      document.cookie = `${SESSION_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  }, []);

  // Reset chat (used for new chat, but does not clear session cookie)
  const resetChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setMessages([]);
    setIsLoading(false);
    setRetryCount(0);
    setDocumentId(null);
    lastUserMessageRef.current = "";
  }, []);

  return {
    message,
    setMessage,
    messages,
    setMessages,
    isLoading,
    handleSubmit,
    resetChat,
    clearUserSession, // Expose for logout
    messagesEndRef,
    retryCount,
    handleSubmitWithFiles,
    setDocumentId, // Expose for manual reset if needed
    fetchAIResponse,
  };
}
