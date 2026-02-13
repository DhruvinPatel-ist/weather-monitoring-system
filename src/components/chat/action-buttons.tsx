import { useState, useRef } from "react";
import { Plus, BarChart2, Bell, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { toast } from "sonner";

export interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  file: File; // Store the actual file object
}

interface ActionButtonsProps {
  onFileUpload: (files: UploadedFile[]) => void;
}

export function ActionButtons({ onFileUpload }: ActionButtonsProps) {
  const t = useTranslations("ChatAI");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: UploadedFile[] = Array.from(e.target.files).map(
        (file) => ({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type,
          file: file,
        })
      );

      // Simulate upload
      simulateUpload(newFiles);
    }

    // Clear the input value to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const simulateUpload = (newFiles: UploadedFile[]) => {
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      onFileUpload(newFiles);
      toast.success(
        `${newFiles.length} file${newFiles.length > 1 ? "s" : ""} ready to send`
      );
    }, 1000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // const handleCreateReport = () => {
  //   toast.info("Creating a new report...");
  //   // Implement report creation logic
  // };

  const handleAnalyzeReports = () => {
    toast.info("Analyzing reports...");
    // Implement report analysis logic
  };

  const handleCheckAlerts = () => {
    toast.info("Checking alerts...");
    // Implement alerts checking logic
  };

  const handleExportData = () => {
    toast.info("Exporting data...");
    // Implement data export logic
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            variant="outline"
            className="bg-[#f2f6f9] text-[#667085] border-[#eaecf0] hover:bg-blue-50 hover:text-blue1 hover:border-blue-200 gap-2 rounded-xl shadow-sm transition-all duration-200"
            onClick={triggerFileInput}
          >
            <Plus className="h-4 w-4" />
            {t("Create Report")}
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            variant="outline"
            className="bg-[#f2f6f9] text-[#667085] border-[#eaecf0] hover:bg-blue-50 hover:text-blue1 hover:border-blue-200 gap-2 rounded-xl shadow-sm transition-all duration-200"
            onClick={handleAnalyzeReports}
          >
            <BarChart2 className="h-4 w-4" />
            {t("Analyse Reports")}
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            variant="outline"
            className="bg-[#f2f6f9] text-[#667085] border-[#eaecf0] hover:bg-blue-50 hover:text-blue1 hover:border-blue-200 gap-2 rounded-xl shadow-sm transition-all duration-200"
            onClick={handleCheckAlerts}
          >
            <Bell className="h-4 w-4" />
            {t("Check Alerts")}
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            variant="outline"
            className="bg-[#f2f6f9] text-[#667085] border-[#eaecf0] hover:bg-blue-50 hover:text-blue1 hover:border-blue-200 gap-2 rounded-xl shadow-sm transition-all duration-200"
            onClick={handleExportData}
          >
            <Download className="h-4 w-4" />
            {t("Export Data")}
          </Button>
        </motion.div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileUpload}
        multiple
      />

      {/* {uploading && (
        <div className="mt-4 w-full bg-white rounded-lg p-3 border border-[#e8ecef]">
          <p className="text-sm text-center text-gray-600 mb-2">
            Preparing files...
          </p>
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1 }}
            className="bg-blue1 h-1.5 rounded-full"
          />
        </div>
      )} */}
    </div>
  );
}
