import api from "@/app/api/api";
import axios from "axios";
import { getSession } from "next-auth/react";

export const getimages = async () => {
  try {
    const response = await api.get("/images"); // Returns array of { id }
    return response.data;
  } catch (error) {
    console.error("Error fetching image metadata:", error);
    throw error;
  }
};

export const getImage = async (imageId: string) => {
  const response = await api.get(`/images/${imageId}`, {
    responseType: "blob",
  });
  return response.data; // This will be a Blob
};

export const deleteImage = async (imageId: string) => {
  try {
    const response = await api.delete(`/images/${imageId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
};

export const createImage = async (file: File) => {
  const session = await getSession();
  const token = session?.accessToken;

  const baseurl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const formData = new FormData();
  formData.append("file", file); // MUST match upload.single("file")

  const response = await axios.post(
    `${baseurl}images`, // ✅ Correct interpolation of variable
    formData,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  return response.data;
};
