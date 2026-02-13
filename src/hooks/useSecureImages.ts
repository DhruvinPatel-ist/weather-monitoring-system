import { useEffect, useState, useRef } from "react";
import { getSession } from "next-auth/react";

interface SecureImage {
  id: string;
  name: string;
  blobUrl: string;
  size?: number;
}

interface ImageInput {
  id?: string;
  originalname: string;
  size?: number;
}

export function useSecureImages(images: ImageInput[]) {
  const [secureImages, setSecureImages] = useState<SecureImage[]>([]);
  const [loading, setLoading] = useState(true);
  const sessionRef = useRef<any>(null);
  const previousBlobUrls = useRef<string[]>([]);

  useEffect(() => {
    const loadImages = async () => {
      setLoading(true);

      if (!sessionRef.current) {
        sessionRef.current = await getSession();
      }

      const token = sessionRef.current?.accessToken;
      // console.log("Access token:", token);

      if (!token) {
        console.warn("No access token found.");
        setLoading(false);
        return;
      }

      const validImages = images.filter((img) => img?.id);
      // console.log(
      //   "Valid image IDs:",
      //   validImages.map((img) => img.id)
      // );

      previousBlobUrls.current.forEach(URL.revokeObjectURL);
      previousBlobUrls.current = [];

      const fetched = await Promise.all(
        validImages.map(async (img) => {
          try {
            const res = await fetch(
              `https://fea-wms.onrender.com/api/images/${img.id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: "image/*",
                },
              }
            );

            if (!res.ok) {
              const text = await res.text();
              console.error(
                `Failed to fetch image ${img.id}:`,
                res.status,
                text
              );
              return null;
            }

            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            previousBlobUrls.current.push(blobUrl);

            return {
              id: img.id!,
              name: img.originalname,
              size: img.size,
              blobUrl,
            };
          } catch (error) {
            console.error(`Error fetching image ${img.id}:`, error);
            return null;
          }
        })
      );

      setSecureImages(fetched.filter(Boolean) as SecureImage[]);
      setLoading(false);
    };

    if (images.length > 0) {
      loadImages();
    } else {
      setSecureImages([]);
      setLoading(false);
    }

    return () => {
      previousBlobUrls.current.forEach(URL.revokeObjectURL);
    };
  }, [images]);

  return { secureImages, loading };
}
