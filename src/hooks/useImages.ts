import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getimages, deleteImage } from "@/services/Images"; // Rename your original file to imageService.ts

export function useImages() {
  return useQuery({
    queryKey: ["images"],
    queryFn: getimages,
  });
}

export function useDeleteImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
    },
  });
}
