"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Pencil, Trash2, Save, X, AlertTriangle } from "lucide-react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { TextEditor } from "@/components/text-editor";
import { DateRangePicker } from "../PopoverDatePicker";
import { useNotes } from "@/hooks/useNotes";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

// Helper function to sanitize HTML content
const sanitizeHtml = (html: string): string => {
  return html
    .replace(/<p class="editor-paragraph">/g, "")
    .replace(/<\/p>/g, "")
    .replace(/<p>/g, "")
    .replace(/<br>/g, "\n")
    .trim();
};

// Confirmation Dialog Component using Portal
function DeleteConfirmationDialog({
  isOpen,
  onConfirm,
  onCancel,
  noteTitle,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  noteTitle: string;
}) {
  const t = useTranslations("Notes");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when dialog is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const dialogContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 relative transform transition-all"
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          maxWidth: "28rem",
          width: "100%",
          margin: "0 1rem",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <AlertTriangle
                  className="h-6 w-6 text-red-500"
                  style={{ color: "#ef4444" }}
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t("confirmDelete") || "Delete Note"}
              </h3>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              style={{ color: "#9ca3af" }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-4">
          <p className="text-gray-600 mb-3">
            {t("deleteConfirmationMessage") ||
              "Are you sure you want to delete this note?"}
          </p>

          <div
            className="p-3 rounded border-l-4"
            style={{
              backgroundColor: "#f9fafb",
              borderLeftColor: "#ef4444",
              borderLeftWidth: "4px",
            }}
          >
            <p className="font-medium text-gray-800">&quot;{noteTitle}&quot;</p>
          </div>

          <p className="mt-3 text-sm text-red-600">
            {t("deleteWarning") || "This action cannot be undone."}
          </p>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex justify-end gap-3"
          style={{ borderTopColor: "#e5e7eb", borderTopWidth: "1px" }}
        >
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            style={{
              borderColor: "#d1d5db",
              color: "#374151",
            }}
          >
            {t("cancel") || "Cancel"}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md text-white flex items-center gap-2 transition-colors"
            style={{
              backgroundColor: "#ef4444",
              color: "white",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#dc2626";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ef4444";
            }}
          >
            <Trash2 className="h-4 w-4" />
            {t("delete") || "Delete"}
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render at document body level
  return createPortal(dialogContent, document.body);
}

export function NotesContent() {
  const {
    notes,
    loading,
    error,
    updateExistingNote,
    deleteExistingNote,
    createNewNote,
    fetchNotes,
    fetchNotesByDate,
  } = useNotes();

  const t = useTranslations("Notes");
  const isMobileOrTablet = useDeviceDetection();
  const [editingNote, setEditingNote] = useState<any | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [filteredNotes, setFilteredNotes] = useState<any[]>([]);
  const [editorContent, setEditorContent] = useState("");
  const [noteData, setNoteData] = useState({ title: "", description: "" });
  const [editorKey, setEditorKey] = useState("new-note-editor");
  const [isDateFiltered, setIsDateFiltered] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const editorKeyCounter = useRef(0);

  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    noteId: string;
    noteTitle: string;
  }>({
    show: false,
    noteId: "",
    noteTitle: "",
  });

  // Initial fetch of notes when component mounts
  useEffect(() => {
    const initialFetch = async () => {
      try {
        await fetchNotes();
      } catch (err) {
        console.error("Initial fetch error:", err);
      }
    };

    initialFetch();
  }, [refreshKey]);

  // Update filtered notes when notes change
  useEffect(() => {
    if (!isDateFiltered) {
      setFilteredNotes(notes);
    }
  }, [notes, isDateFiltered]);

  const handleEditNote = (note: any) => {
    setEditingNote(note);
    setIsCreatingNote(false);
    setEditorContent(
      `<h1>${note.title || ""}</h1><p>${note.description || ""}</p>`
    );
    setNoteData({ title: note.title, description: note.description });
    editorKeyCounter.current += 1;
    setEditorKey(`editor-${note.id}-${editorKeyCounter.current}`);
  };

  // Show delete confirmation dialog
  const handleDeleteNote = (id: string, title: string) => {
    console.log("Opening delete confirmation for:", { id, title });
    setDeleteConfirmation({
      show: true,
      noteId: id,
      noteTitle: title,
    });
  };

  // Confirm delete action
  const confirmDeleteNote = async () => {
    const { noteId } = deleteConfirmation;
    console.log("Confirming delete for note:", noteId);

    try {
      await deleteExistingNote(noteId);
      toast.success(t("noteDeletedSuccess") || "Note deleted successfully");

      if (editingNote?.id === noteId) {
        resetEditor();
      }

      // Refresh the notes list
      triggerRefresh();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(t("failedToDeleteNote") || "Failed to delete note");
    }

    // Close confirmation dialog
    setDeleteConfirmation({
      show: false,
      noteId: "",
      noteTitle: "",
    });
  };

  // Cancel delete action
  const cancelDeleteNote = () => {
    console.log("Delete cancelled");
    setDeleteConfirmation({
      show: false,
      noteId: "",
      noteTitle: "",
    });
  };

  const resetEditor = () => {
    setEditingNote(null);
    setIsCreatingNote(false);
    setEditorContent("");
    setNoteData({ title: "", description: "" });
    editorKeyCounter.current += 1;
    setEditorKey(`new-note-editor-${editorKeyCounter.current}`);
  };

  const handleSaveNote = async () => {
    const sanitizedDescription = sanitizeHtml(noteData.description);
    const title = noteData.title.trim();
    const finalTitle =
      title ||
      (sanitizedDescription.length > 20
        ? sanitizedDescription.substring(0, 20) + "..."
        : sanitizedDescription || "Untitled Note");

    try {
      if (editingNote) {
        await updateExistingNote(editingNote.id, {
          title: finalTitle,
          description: sanitizedDescription,
        });
        toast.success(t("noteUpdatedSuccess"));
      } else {
        await createNewNote({
          title: finalTitle,
          description: sanitizedDescription,
        });
        toast.success(t("noteCreatedSuccess"));
      }
      resetEditor();

      if (!isDateFiltered) {
        triggerRefresh();
      }
    } catch {
      toast.error(
        editingNote ? t("failedToUpdateNote") : t("failedToCreateNote")
      );
    }
  };

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleDateChange = async (startDate: Date, endDate: Date) => {
    try {
      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];

      setIsDateFiltered(true);

      // FIX: Remove the extra "range/" prefix
      const dateRangeParam = `${formattedStartDate}/${formattedEndDate}`;
      const filteredData = await fetchNotesByDate(dateRangeParam);

      if (Array.isArray(filteredData)) {
        setFilteredNotes(filteredData);
      } else {
        setFilteredNotes([]);
      }
    } catch (err) {
      toast.error("Failed to filter notes by date");
      console.error("Error filtering notes:", err);
      setIsDateFiltered(false);
      // Reset to show all notes on error
      setFilteredNotes(notes);
    }
  };

  const handleResetDateFilter = async () => {
    setIsDateFiltered(false);

    try {
      triggerRefresh();
      toast.success(t("filterCleared"));
    } catch (err) {
      toast.error(t("failedToClearFilter"));
      console.error("Error clearing filter:", err);
    }
  };

  const handleTryAgain = async () => {
    try {
      setError(""); // Clear the error state
      toast.info(t("tryingToFetchNotesAgain"));

      // Fetch fresh data
      // const freshData = await fetchNotes();

      // If we're in date filtered mode, we need to re-apply the filter
      // For now, just reset to show all notes
      if (isDateFiltered) {
        setIsDateFiltered(false);
      }

      toast.success("Notes loaded successfully");
    } catch (err) {
      console.error("Error in handleTryAgain:", err);
      toast.error("Failed to load notes. Please try again.");
    }
  };

  const handleEditorChange = (data: { title: string; description: string }) => {
    setNoteData(data);
    if (!editingNote && !isCreatingNote && (data.title || data.description)) {
      setIsCreatingNote(true);
    }
    if (isCreatingNote && !data.title && !data.description) {
      setIsCreatingNote(false);
    }
  };

  const sortedNotes = (filteredNotes.length ? filteredNotes : notes).sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <>
      <div
        className={`space-y-4 p-2 bg-white1 rounded-lg ${
          isMobileOrTablet ? "flex flex-col" : "flex flex-row"
        } gap-2`}
      >
        <div className="w-full gap-2 items-center">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-md font-semibold">{t("notesTitle")}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {isDateFiltered && (
                <button
                  onClick={handleResetDateFilter}
                  className="text-blue-500 text-xs hover:underline mr-2"
                >
                  {t("clearFilter")}
                </button>
              )}
              <DateRangePicker onDateRangeChange={handleDateChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[calc(100vh-240px)] overflow-y-auto">
            {loading ? (
              <>
                <NoteCardSkeleton />
                <NoteCardSkeleton />
              </>
            ) : error ? (
              <div className="col-span-2 text-red-500 p-4 text-center">
                {error}
                <button
                  onClick={handleTryAgain}
                  className="ml-2 text-blue-500 underline"
                >
                  {t("tryAgain")}
                </button>
              </div>
            ) : sortedNotes.length > 0 ? (
              sortedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  title={note.title}
                  date={new Date(note.created_at).toLocaleDateString()}
                  content={sanitizeHtml(note.description)}
                  variant="yellow"
                  onEdit={() => handleEditNote(note)}
                  onDelete={() => handleDeleteNote(note.id, note.title)}
                />
              ))
            ) : (
              <div className="col-span-2 flex justify-center items-center p-8 text-gray-500">
                <p>{t("noNotesFound")}</p>
              </div>
            )}
          </div>
        </div>

        <div className="w-full">
          <TextEditor
            placeholder={
              editingNote ? t("editNotePlaceholder") : t("addNotePlaceholder")
            }
            className="h-110"
            content={editorContent}
            onChange={handleEditorChange}
            key={editorKey}
          />
          {(editingNote || isCreatingNote) && (
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleSaveNote}
                className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2"
                disabled={!noteData.title && !noteData.description}
              >
                <Save className="w-4 h-4" />
                {editingNote ? t("save") : t("create")}
              </button>
              <button
                onClick={resetEditor}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                {t("cancel")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteConfirmation.show}
        onConfirm={confirmDeleteNote}
        onCancel={cancelDeleteNote}
        noteTitle={deleteConfirmation.noteTitle}
      />
    </>
  );
}

// Skeleton loader component
function NoteCardSkeleton() {
  return (
    <div className="p-4 border rounded-lg bg-gray-200 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-4 w-1/3 bg-gray-300 rounded"></div>
        <div className="h-4 w-1/6 bg-gray-300 rounded"></div>
      </div>
      <div className="h-3 w-1/4 bg-gray-300 rounded mb-2"></div>
      <div className="h-3 w-full bg-gray-300 rounded mb-2"></div>
    </div>
  );
}

function NoteCard({
  title,
  date,
  content,
  variant = "yellow",
  onEdit,
  onDelete,
}: {
  title: string;
  date: string;
  content: React.ReactNode;
  variant?: "yellow" | "blue";
  onEdit: () => void;
  onDelete: () => void;
}) {
  const bgColor = variant === "yellow" ? "bg-[#fdf6d2]" : "bg-[#e0ecff]";

  return (
    <div className={`p-4 border rounded-lg ${bgColor}`}>
      <div className="flex items-center justify-between mb-2 p-1 border-b-1 border-gray-400">
        <p className="text-xs text-gray-500">{date}</p>

        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
            title="Delete note"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex items-start mb-2">
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      <div className="text-sm">{content}</div>
    </div>
  );
}
function setError(error: string) {
  throw new Error("Function not implemented.");
  console.log(error);
}
