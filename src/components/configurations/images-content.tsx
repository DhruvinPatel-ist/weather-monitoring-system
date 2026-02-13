"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useImages, useDeleteImage } from "@/hooks/useImages";
import { getImage, createImage } from "@/services/Images";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Upload } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface ImageData {
  id: number;
  originalname: string;
  mimetype: string;
  size: number;
  link: string;
}

interface ResolvedImage {
  id: number;
  url: string;
  originalname: string;
  isError?: boolean;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Validate the base64 result
      if (result && result.startsWith("data:")) {
        resolve(result);
      } else {
        reject(new Error("Invalid base64 data"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });
}

export function ImagesContent() {
  const { data: images = [], isLoading, refetch } = useImages();
  const { mutate: deleteImageMutation } = useDeleteImage();
  const [resolvedImages, setResolvedImages] = useState<ResolvedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const t = useTranslations();

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("SettingsPage.onlyImageAllowed"));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("SettingsPage.imageSizeLimit"));
      return;
    }

    setUploading(true);

    try {
      await createImage(file);
      toast.success(t("SettingsPage.uploadSuccess"));
      await refetchImages();
    } catch (error) {
      console.error(error);
      toast.error(t("SettingsPage.uploadFailed"));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const refetchImages = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteImageMutation(id, {
      onSuccess: () => {
        toast.success(t("SettingsPage.deleteSuccess"));
        refetchImages();
      },
      onError: () => {
        toast.error(t("SettingsPage.deleteFailed"));
      },
    });
  };

  // Memoized callback to handle image errors
  const handleImageError = useCallback((imageId: number) => {
    console.error("Image load error for ID:", imageId);
    setResolvedImages((prev) =>
      prev.map((img) => (img.id === imageId ? { ...img, isError: true } : img))
    );
  }, []);

  useEffect(() => {
    // Only run if images is not empty and has changed length
    if (!images || images.length === 0) {
      setResolvedImages([]);
      return;
    }

    const fetchAllBlobs = async () => {
      try {
        const all: ResolvedImage[] = await Promise.allSettled(
          images.map(async (img: ImageData): Promise<ResolvedImage> => {
            try {
              const blob = await getImage(img.id.toString());

              // Validate blob
              if (!blob || blob.size === 0) {
                throw new Error("Empty or invalid blob");
              }

              const base64Url = await blobToBase64(blob);

              // Additional validation for base64
              if (!base64Url || base64Url.length < 50) {
                throw new Error("Invalid base64 data");
              }

              return {
                id: img.id,
                url: base64Url,
                originalname: img.originalname,
                isError: false,
              };
            } catch (error) {
              console.error(`Failed to process image ${img.id}:`, error);
              return {
                id: img.id,
                url: "", // Empty URL for error state
                originalname: img.originalname,
                isError: true,
              };
            }
          })
        ).then((results) =>
          results.map((result) =>
            result.status === "fulfilled"
              ? result.value
              : {
                  id: 0,
                  url: "",
                  originalname: "Error loading image",
                  isError: true,
                }
          )
        );

        setResolvedImages(all);
      } catch (err) {
        console.error("❌ Failed to fetch image blobs:", err);
        // Set error state for all images
        setResolvedImages(
          images.map(
            (img: ImageData): ResolvedImage => ({
              id: img.id,
              url: "",
              originalname: img.originalname,
              isError: true,
            })
          )
        );
      }
    };

    fetchAllBlobs();
  }, [images.length]);

  const isLoadingState = isLoading || refreshing;

  return (
    <div className="space-y-2 p-4 bg-transparent rounded-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {t("SettingsPage.photos")} ({images.length}){" "}
          {uploading && (
            <span className="text-sm text-blue-500 ml-2">
              ({t("SettingsPage.uploading")})
            </span>
          )}
        </h2>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleUploadClick}
            className="flex gap-2 items-center"
            disabled={uploading}
          >
            <Upload className="h-4 w-4" />
            {t("SettingsPage.upload")}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
        </div>
      </div>

      {/* Fixed Height + Scrollable */}
      <div className="max-h-[calc(100vh-240px)] overflow-y-auto p-2 rounded-md">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {isLoadingState
            ? [...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-36 w-full rounded-md" />
              ))
            : resolvedImages.map((img) => (
                <ImageCard
                  key={img.id}
                  img={img}
                  onDelete={handleDelete}
                  onError={handleImageError}
                  t={t}
                />
              ))}
        </div>
      </div>
    </div>
  );
}

// Separate component to prevent re-render issues
interface ImageCardProps {
  img: ResolvedImage;
  onDelete: (id: string) => void;
  onError: (imageId: number) => void;
  t: any;
}

const ImageCard: React.FC<ImageCardProps> = ({ img, onDelete, onError, t }) => {
  const [hasError, setHasError] = useState(img.isError || false);

  const handleError = useCallback(() => {
    if (!hasError) {
      setHasError(true);
      onError(img.id);
    }
  }, [hasError, img.id, onError]);

  return (
    <div className="relative group rounded-lg overflow-hidden border border-gray-300">
      {hasError || !img.url ? (
        <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-500 text-sm">
            {t("SettingsPage.imageLoadError") || "Failed to load"}
          </span>
        </div>
      ) : (
        <Image
          src={img.url}
          alt={img.originalname}
          width={200}
          height={160}
          className="w-full h-40 object-cover"
          onError={handleError}
          unoptimized // Disable Next.js optimization for base64 images
        />
      )}
      <button
        onClick={() => onDelete(img.id.toString())}
        className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1 text-red-600 shadow-md"
        aria-label={t("SettingsPage.deleteImage")}
      >
        <Trash2 size={16} />
      </button>
      <div className="text-xs text-center py-1 truncate px-2 bg-gray-50">
        {img.originalname}
      </div>
    </div>
  );
};
