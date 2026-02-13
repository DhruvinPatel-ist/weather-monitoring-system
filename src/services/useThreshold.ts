import api from "@/app/api/api"; // your axios instance
import { getSession } from "next-auth/react";
import { Threshold, ThresholdRequest } from "@/types/threshold";

// GET all thresholds
export const getThresholds = async (): Promise<Threshold[]> => {
  const session = await getSession();
  const res = await api.get("/thresholds", {
    headers: { Authorization: `Bearer ${session?.accessToken}` },
  });
  return res.data;
};

// GET threshold by ID
export const getThresholdById = async (id: string): Promise<Threshold> => {
  const session = await getSession();
  const res = await api.get(`/threshold/${id}`, {
    headers: { Authorization: `Bearer ${session?.accessToken}` },
  });
  return res.data;
};

// CREATE threshold
export const createThreshold = async (data: ThresholdRequest) => {
  const session = await getSession();
  return api.post("/threshold", data, {
    headers: { Authorization: `Bearer ${session?.accessToken}` },
  });
};

// UPDATE threshold
export const updateThreshold = async (id: string, data: ThresholdRequest) => {
  const session = await getSession();
  return api.put(`/threshold/${id}`, data, {
    headers: { Authorization: `Bearer ${session?.accessToken}` },
  });
};

// DELETE threshold
export const deleteThreshold = async (id: string) => {
  const session = await getSession();
  return api.delete(`/threshold/${id}`, {
    headers: { Authorization: `Bearer ${session?.accessToken}` },
  });
};
