"use client";

import React from "react";

interface CustomWidget5Props {
  value: number;
  colors?: string[]; // [low, mid, high]
}

export function CustomWidget5({ value, colors = [] }: CustomWidget5Props) {
  const clamped = Math.max(0, value);

  const fillLow = colors[0] || "#FF6644";
  const fillMid = colors[1] || "#FF6644";
  const fillHigh = colors[2] || "#6EB1E1";

  // Determine needle path based on clamped value (same logic as before)
  let needleD = "";
  if (clamped <= 0) {
    needleD =
      "M16.7,52L15,50.8v-0.2H9v0.2L7.4,52c-2.2,1.5-3.4,4-3.4,6.6c0,4.4,3.6,8.1,8.1,8.1c4.4,0,8.1-3.6,8.1-8.1C20.1,55.9,18.8,53.5,16.7,52z";
  } else if (clamped > 0 && clamped < 50) {
    needleD =
      "M16.7,52L15,50.8V37.6H9v13.2L7.4,52c-2.2,1.5-3.4,4-3.4,6.6c0,4.4,3.6,8.1,8.1,8.1c4.4,0,8.1-3.6,8.1-8.1C20.1,55.9,18.8,53.5,16.7,52z";
  } else if (clamped === 50) {
    needleD =
      "M16.7,52L15,50.8V30.6H9v20.2L7.4,52c-2.2,1.5-3.4,4-3.4,6.6c0,4.4,3.6,8.1,8.1,8.1c4.4,0,8.1-3.6,8.1-8.1C20.1,55.9,18.8,53.5,16.7,52z";
  } else if (clamped > 50 && clamped < 100) {
    needleD =
      "M16.6506 51.9635L15.036 50.8399V18.6035H9.04693V50.8399L7.43238 51.9635C5.27238 53.469 3.98511 55.9344 3.98511 58.5526C3.98511 62.9926 7.59602 66.6035 12.036 66.6035C16.476 66.6035 20.0869 62.9926 20.0869 58.5526C20.0978 55.9453 18.8106 53.4799 16.6506 51.9635Z";
  } else {
    needleD =
      "M16.7,52L15,50.8V5.6H9v45.2L7.4,52c-2.2,1.5-3.4,4-3.4,6.6c0,4.4,3.6,8.1,8.1,8.1c4.4,0,8.1-3.6,8.1-8.1C20.1,55.9,18.8,53.5,16.7,52z";
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-0">
      <svg
        width="37"
        height="71"
        viewBox="0 0 37 71"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-12 h-20 scale-[0.8] md:scale-100"
      >
        {/* Base */}
        <path
          d="M18.8101 48.8769V7.32418C18.8101 3.59327 15.7774 0.560547 12.0465 0.560547C8.31557 0.560547 5.28284 3.59327 5.28284 7.32418V48.8769C2.2283 51.0151 0.231934 54.5496 0.231934 58.5642C0.231934 65.0878 5.52284 70.3787 12.0465 70.3787C18.5701 70.3787 23.861 65.0878 23.861 58.5642C23.8719 54.5496 21.8647 51.0151 18.8101 48.8769Z"
          fill="#DEDEDF"
        />

        {/* Needle */}
        <path className="st1" d={needleD} fill={fillLow} />

        {/* Indicator blocks */}
        <path d="M21.908 8.10938H29.8716V10.2039H21.908V8.10938Z" fill={fillMid} />
        <path d="M21.908 12.3086H25.8898V14.4031H21.908V12.3086Z" fill={fillMid} />
        <path d="M21.908 16.5098H29.8716V18.6043H21.908V16.5098Z" fill={fillMid} />
        <path d="M21.908 20.709H25.8898V22.8035H21.908V20.709Z" fill={fillMid} />
        <path d="M21.908 24.8984H36.297V26.993H21.908V24.8984Z" fill="#DEDEDF" />
        <path d="M21.908 29.0977H25.8898V31.1922H21.908V29.0977Z" fill={fillHigh} />
        <path d="M21.908 33.2988H29.8716V35.3934H21.908V33.2988Z" fill={fillHigh} />
        <path d="M21.908 37.498H25.8898V39.5926H21.908V37.498Z" fill={fillHigh} />
        <path d="M21.908 41.6973H29.8716V43.7918H21.908V41.6973Z" fill={fillHigh} />
      </svg>
    </div>
  );
}