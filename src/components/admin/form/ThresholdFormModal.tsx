import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { Threshold, ThresholdRequest } from "@/types/threshold";
import { useThresholdMutations } from "@/hooks/useThresholdMutations";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useStations } from "@/hooks/useDashboard";
import { useStationParameters } from "@/hooks/useParameters";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData: Threshold | null;
}

export function ThresholdFormModal({
  isOpen,
  onClose,
  mode,
  initialData,
}: Props) {
  const t = useTranslations("ThresholdManagement");
  const { create, update } = useThresholdMutations();

  const [selectedStationId, setSelectedStationId] = useState<string>("");
  const { data: stations = [], isLoading: isLoadingStations } = useStations();
  const { data: parameters = [], isLoading: isLoadingParameters } =
    useStationParameters(selectedStationId);

  // Removed static attributeMapping; attributes are now fetched dynamically from API based on selected site.

  const [formData, setFormData] = useState<ThresholdRequest>({
    ParameterID: "", // Using the API naming convention
    threshold_name: "",
    timeInterval: 15, // Use number for API
    SiteID: "",
    Comparator: "<",
    Value: 0,
  });

  // Log for debugging parameters loading
  useEffect(() => {
    // Avoid running effect if no station is selected
    if (!selectedStationId) return;

    console.log(
      `Parameters useEffect triggered. Station ID: ${selectedStationId}, Loading: ${isLoadingParameters}, Parameters: ${parameters.length}`
    );

    if (selectedStationId && parameters.length === 0 && !isLoadingParameters) {
      console.log(`No parameters found for station ID: ${selectedStationId}`);
    } else if (parameters.length > 0) {
      console.log(
        `Loaded ${parameters.length} parameters for station ID: ${selectedStationId}`
      );
      // Log the first parameter to see the structure
      console.log("Sample parameter structure:", parameters[0]);

      // In edit mode, if we have a parameterId but no matching parameter found yet,
      // check if it exists in the newly loaded parameters
      if (
        mode === "edit" &&
        formData.ParameterID &&
        formData.SiteID === selectedStationId
      ) {
        // List all parameter IDs for debugging
        const paramIds = parameters.map((p: any) => String(p.ParameterID));
        console.log("Available parameter IDs:", paramIds);

        const paramExists = parameters.some(
          (param: any) =>
            String(param.ParameterID) === String(formData.ParameterID)
        );

        if (!paramExists) {
          console.warn(
            `Parameter ID ${formData.ParameterID} not found in loaded parameters for station ${selectedStationId}`
          );

          // No fallback to static attribute mapping; only use API-fetched parameters.
        } else {
          console.log(
            `Found Parameter ID ${formData.ParameterID} in loaded parameters`
          );
        }
      }
    }
  }, [selectedStationId, isLoadingParameters]);

  // Handle form initialization when mode or initialData changes
  useEffect(() => {
    // Skip effect if not open
    if (!isOpen) return;

    if (mode === "edit" && initialData) {
      // Handle both old and new API formats
      const parameterId =
        initialData.ParameterID || initialData.attribute_id || "";

      // Handle null SiteID - either use existing value or default to first station
      let siteId = initialData.SiteID === null ? "" : initialData.SiteID || "";

      console.log(
        `Editing threshold with ParameterID: ${parameterId}, SiteID: ${
          siteId || "null/undefined"
        }`
      );

      // If siteId is missing/null but we have stations loaded, use first station
      if ((!siteId || siteId === "null") && stations.length > 0) {
        const firstStation = stations[0] as any; // Use any to avoid TypeScript errors with different API formats
        siteId = String(
          firstStation.id || firstStation.ID || firstStation.SiteID || ""
        );
        console.log(
          `SiteID was missing/null, defaulting to first station: ${siteId}`
        );
      }

      // First set the selectedStationId to trigger parameter loading
      // If siteId is empty/null, we'll set it once stations load
      if (siteId && siteId !== "null") {
        setSelectedStationId(String(siteId));
      }

      // Then set the form data
      setFormData({
        ParameterID: String(parameterId),
        threshold_name: String(initialData.threshold_name || ""),
        timeInterval: Number(initialData.timeInterval || 15),
        Value: initialData.Value !== undefined ? Number(initialData.Value) : 0,
        Comparator: String(initialData.Comparator || "<"),
        SiteID: siteId && siteId !== "null" ? String(siteId) : "",
      });

      console.log("Form data initialized for edit:", {
        ParameterID: String(parameterId),
        SiteID: siteId || "Not set yet",
      });
    } else if (mode === "create") {
      setFormData({
        ParameterID: "", // Empty string for a new entry
        threshold_name: "",
        timeInterval: 15,
        Value: 0,
        Comparator: "<",
        SiteID: "",
      });
      setSelectedStationId("");
    }
    // Only run when modal opens or when initialData, mode or stations change
  }, [initialData, mode, isOpen, stations]);

  const handleChange = (
    key: keyof ThresholdRequest,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = (): boolean => {
    // Validate required fields
    if (!formData.SiteID) {
      toast.error("Please select a station", {
        style: {
          background: "#f97316",
          color: "white",
          border: "none",
        },
      });
      return false;
    }

    if (!formData.ParameterID) {
      toast.error("Please select a parameter", {
        style: {
          background: "#f97316",
          color: "white",
          border: "none",
        },
      });
      return false;
    }

    return true;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    console.log("Submitting form with data:", formData);

    // Prepare the data in the format expected by the API
    const apiData = {
      ParameterID: formData.ParameterID,
      SiteID: formData.SiteID,
      Comparator: formData.Comparator,
      Value: formData.Value,
      threshold_name: formData.threshold_name,
      timeInterval: Number(formData.timeInterval),
    };

    try {
      if (mode === "create") {
        await create.mutateAsync(apiData);
        toast.success("Threshold created successfully");
      } else if (mode === "edit" && initialData) {
        // Get ID from either property based on API response format
        const id = initialData.ID || initialData.id;
        if (!id) {
          toast.error("Missing threshold ID");
          return;
        }

        console.log(`Updating threshold with ID: ${id}`);

        // For edit mode, make sure to include the ID in the data
        // Include both ID and id to handle different API formats
        const updateData = {
          ...apiData,
          ID: id,
          id: id,
        };

        await update.mutateAsync({ id, data: updateData });
        toast.success("Threshold updated successfully");
      }

      // Close modal on success
      onClose();
    } catch (error) {
      console.error("Error saving threshold:", error);
      toast.error(
        mode === "create"
          ? "Failed to create threshold"
          : "Failed to update threshold"
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? t("addThreshold") : t("editThreshold")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <Label>Station</Label>
            <Select
              value={String(formData.SiteID || "")}
              onValueChange={(value) => {
                console.log(`Selected station ID: ${value}`);
                setSelectedStationId(value);
                handleChange("SiteID", value);
                // Only reset parameter when station changes and not in initial edit mode load
                if (mode !== "edit" || value !== String(initialData?.SiteID)) {
                  handleChange("ParameterID", "");
                }
              }}
              disabled={isLoadingStations}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingStations ? "Loading stations..." : "Select Station"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {stations
                  .filter(
                    (station: any) =>
                      station && (station.id || station.ID || station.SiteID)
                  ) // Filter out items with no id
                  .map((station: any) => {
                    const stationId =
                      station.id || station.ID || station.SiteID;
                    return (
                      <SelectItem
                        key={`station-${stationId}`}
                        value={String(stationId)}
                      >
                        {station.name ||
                          station.title ||
                          station.SiteName ||
                          "Station " + stationId}
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
            {mode === "edit" && formData.SiteID && (
              <div className="text-xs text-gray-500 mt-1">
                Selected station ID: {formData.SiteID}
              </div>
            )}
          </div>

          <div>
            <Label>{t("parameter")}</Label>
            <Select
              value={String(formData.ParameterID || "")}
              onValueChange={(value) => handleChange("ParameterID", value)}
              disabled={!selectedStationId || isLoadingParameters}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !selectedStationId
                      ? "Select a station first"
                      : isLoadingParameters
                      ? "Loading parameters..."
                      : t("selectAttribute")
                  }
                />
              </SelectTrigger>
              {/* Content for the parameter selection */}
              <SelectContent>
                {parameters.length > 0
                  ? parameters
                      .filter((param: any) => param && param.ParameterID)
                      .map((param: any) => {
                        const paramId = String(param.ParameterID);
                        return (
                          <SelectItem key={`param-${paramId}`} value={paramId}>
                            {param.ParameterName || `Parameter ${paramId}`}
                          </SelectItem>
                        );
                      })
                  : !isLoadingParameters && selectedStationId && (
                      <div className="p-2 text-sm text-gray-500">
                        No parameters available
                      </div>
                    )}
              </SelectContent>
            </Select>
            {mode === "edit" && formData.ParameterID && (
              <div className="text-xs text-gray-500 mt-1">
                Selected parameter ID: {formData.ParameterID}
              </div>
            )}
          </div>

          <div>
            <Label>{t("thresholdName")}</Label>
            <Input
              value={formData.threshold_name || ""}
              onChange={(e) => handleChange("threshold_name", e.target.value)}
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Comparator</Label>
              <Select
                value={String(formData.Comparator || "<")}
                onValueChange={(value) => handleChange("Comparator", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<">{"<"} (Less Than)</SelectItem>
                  <SelectItem value=">">{">"} (Greater Than)</SelectItem>
                  <SelectItem value="<=">
                    {"<="} (Less Than or Equal)
                  </SelectItem>
                  <SelectItem value=">=">
                    {">="} (Greater Than or Equal)
                  </SelectItem>
                  <SelectItem value="=">={"="} (Equal To)</SelectItem>
                  <SelectItem value="&">={"&"} (And)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label>Value</Label>
              <Input
                type="number"
                value={formData.Value || 0}
                onChange={(e) =>
                  handleChange("Value", parseFloat(e.target.value))
                }
                required
              />
            </div>
          </div>

          <div>
            <Label>{t("interval")} (minutes)</Label>
            <Select
              value={String(formData.timeInterval || 15)}
              onValueChange={(value) =>
                handleChange("timeInterval", Number(value))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 {t("minutes")}</SelectItem>
                <SelectItem value="30">30 {t("minutes")}</SelectItem>
                <SelectItem value="60">
                  60 {t("minutes")} (1 {t("hour")})
                </SelectItem>
                <SelectItem value="1440">
                  1440 {t("minutes")} (24 {t("hours")})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-[#009fac] hover:bg-[#008a96] text-white"
              disabled={create.isPending || update.isPending}
            >
              {create.isPending || update.isPending
                ? "Saving..."
                : mode === "create"
                ? t("create")
                : t("update")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
