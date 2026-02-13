import { FileText } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <FileText className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium mb-2">No Reports Yet</h3>
      <p className="text-gray-500 max-w-md">
        You&apos;ll see data when you are generated
      </p>
    </div>
  );
}
