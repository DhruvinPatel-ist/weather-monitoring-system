/*eslint-disable*/

import { useState, useEffect } from "react";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  getNoteById,
  getNotesByDate,
} from "@/services/Notes";

export const useNotes = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const data = await getNotes();
      setNotes(data);
    } catch (err) {
      setError("Failed to load notes.");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotesByDate = async (date: string) => {
    setLoading(true);
    try {
      const data = await getNotesByDate(date);
      setNotes(data);
    } catch (err) {
      setError("Failed to load notes.");
    } finally {
      setLoading(false);
    }
  };

  const createNewNote = async (noteData: {
    title: string;
    description: string;
  }) => {
    try {
      const newNote = await createNote(noteData);
      setNotes((prevNotes) => [...prevNotes, newNote]);
    } catch (err) {
      setError("Failed to create note.");
    }
  };

  const updateExistingNote = async (
    noteId: string,
    noteData: { title: string; description: string }
  ) => {
    try {
      const updatedNote = await updateNote(noteId, noteData);
      setNotes((prevNotes) =>
        prevNotes.map((note) => (note.id === noteId ? updatedNote : note))
      );
    } catch (err) {
      setError("Failed to update note.");
    }
  };

  const deleteExistingNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
    } catch (err) {
      setError("Failed to delete note.");
    }
  };

  const fetchNoteById = async (noteId: string) => {
    try {
      const note = await getNoteById(noteId);
      return note;
    } catch (err) {
      setError("Failed to fetch note.");
    }
  };

  return {
    notes,
    loading,
    error,
    fetchNotes,
    createNewNote,
    updateExistingNote,
    deleteExistingNote,
    fetchNoteById,
    fetchNotesByDate,
  };
};
