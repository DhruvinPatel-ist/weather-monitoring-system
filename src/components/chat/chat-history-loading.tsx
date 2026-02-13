import { motion } from "framer-motion";
import Image from "next/image";

export function ChatHistoryLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray1">
      <div className="flex flex-col items-center gap-6 max-w-md mx-auto px-4">
        {/* Animated AI Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue1/20 border-t-blue1 rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src="/assets/chat/AI.svg"
              alt="AI"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
        </motion.div>

        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center"
        >
          <h3 className="text-xl font-semibold text-[#1a1a1a] mb-2">
            Loading Chat History
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Please wait while we fetch your previous conversations...
          </p>
        </motion.div>

        {/* Animated Dots */}
        {/* <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex items-center space-x-2"
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
              }}
              className="w-2 h-2 bg-blue1 rounded-full"
            />
          ))}
        </motion.div> */}
      </div>
    </div>
  );
}
