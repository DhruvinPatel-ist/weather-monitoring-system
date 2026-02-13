import { formatTime } from "@/lib/utils";
import Image from "next/image";
import { motion } from "framer-motion";

export function LoadingIndicator() {
  const time = formatTime(new Date());

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-5 flex justify-start"
    >
      <div className="mr-3 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-white ring-2 ring-blue1/20 flex items-center justify-center shadow">
          <Image
            src="/assets/chat/AI.svg"
            alt="AI"
            width={28}
            height={28}
            className="object-contain"
          />
        </div>
      </div>

      <div className="max-w-[100%]">
        <div className="flex items-center gap-2 mb-1 px-2">
          <span className="text-xs font-semibold text-blue1">Chat AI</span>
          <span className="text-xs text-[#a0a4a8]">{time}</span>
        </div>

        <div className="rounded-lg px-5 py-4 text-sm bg-blue-50 text-blue-900 border border-blue-100 rounded-tl-none shadow-sm">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "loop",
            }}
            className="flex items-center space-x-2"
          >
            <div className="w-2 h-2 bg-blue1 rounded-full opacity-70 animate-bounce"></div>
            <div className="w-2 h-2 bg-blue1 rounded-full opacity-80 animate-bounce delay-150"></div>
            <div className="w-2 h-2 bg-blue1 rounded-full animate-bounce delay-300"></div>
            <span className="text-xs text-blue-400 ml-2">AI is typing…</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
