"use client";

import { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import Image from "next/image";

export function ImageModal({
  imageId,
  onClose,
}: {
  imageId: string;
  onClose: () => void;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    const fetchImage = async () => {
      try {
        setLoading(true);
        setError(null);

        const session = await getSession();
        const token = session?.accessToken;

        if (!token) {
          throw new Error("Authorization token missing.");
        }

        const response = await fetch(
          `https://fea-wms.onrender.com/api/images/${imageId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "image/*",
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);

        if (active) {
          setBlobUrl(objectUrl);
        }
      } catch (err: any) {
        console.error("Error fetching image:", err);
        setError(err.message || "Failed to load image.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchImage();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageId]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="relative bg-white p-4 rounded-lg shadow max-w-3xl w-full">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-red-600 hover:text-red-800 text-sm"
        >
          ✖ Close
        </button>

        {loading ? (
          <div className="text-center py-12 text-gray-700 text-lg">
            Loading image...
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">{error}</div>
        ) : blobUrl ? (
          <>
            <Image
              src={blobUrl}
              alt="Preview"
              className="w-full max-h-[80vh] object-contain rounded"
            />
            <div className="text-right mt-2">
              <a
                href={blobUrl}
                download={`image-${imageId}.jpg`}
                className="text-blue-600 underline text-sm"
              >
                ⬇ Download image
              </a>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-red-600">Image not found.</div>
        )}
      </div>
    </div>
  );
}
