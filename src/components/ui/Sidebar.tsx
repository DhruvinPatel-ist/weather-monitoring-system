"use client"; // Ensure this runs on the client-side if necessary

import { Grid3X3, LayoutGrid } from "lucide-react";
import Link from "next/link";
import React from "react";

const Sidebar: React.FC = () => {
  return (
    <aside className="flex w-16 flex-col items-center border-r bg-white py-4">
      <div className="flex flex-col items-center gap-6">
        <Link href="#">
          <a className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-500 text-white">
            <LayoutGrid className="h-5 w-5" />
          </a>
        </Link>

        <Link href="#">
          <a className="flex h-10 w-10 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100">
            <Grid3X3 className="h-5 w-5" />
          </a>
        </Link>

        <Link href="#">
          <a className="flex h-10 w-10 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
          </a>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
