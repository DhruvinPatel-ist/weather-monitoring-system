"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  defaultCountry?: string;
  onChange?: (value: string) => void;
  value?: string;
  originalValue?: string;
}

export function PhoneInput({
  defaultCountry = "AE",
  onChange,
  value = "",
  originalValue = "",
  ...props
}: PhoneInputProps) {
  const [countryCode, setCountryCode] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("");

  // Initialize state from value
 React.useEffect(() => {
  console.log("[PhoneInput] Initial value:", value);

  if (!value) {
    const code = defaultCountry === "AE" ? "+971" : "+1";
    setCountryCode(code);
    setPhoneNumber("");
    return;
  }

  const cleanedValue = value.replace(/\s+/g, "");
  //console.log("[PhoneInput] Cleaned value:", cleanedValue);

  if (cleanedValue.includes("-")) {
    // Format: +44-53868686
    const [code, number] = cleanedValue.split("-");
    setCountryCode(code);
    setPhoneNumber(number);
    console.log("[PhoneInput] Parsed with '-':", { countryCode: code, phoneNumber: number });
  } else if (cleanedValue.startsWith("+")) {
    // Format: +4453868686
    const codeMatch = cleanedValue.match(/^\+\d{1,3}/);
    const code = codeMatch ? codeMatch[0] : defaultCountry === "AE" ? "+971" : "+1";
    const number = cleanedValue.replace(code, "");
    setCountryCode(code);
    setPhoneNumber(number);
    console.log("[PhoneInput] Parsed with '+' fallback:", { countryCode: code, phoneNumber: number });
  } else {
    // Only number, preserve existing country code if already set
    setPhoneNumber(cleanedValue);
     let newCountryCode = countryCode;

// If no countryCode yet, try from originalValue
if (!newCountryCode && originalValue) {
  const parts = originalValue.split("-");

  if (parts.length === 2) {
    // Original has exactly one dash -> take country code only
    newCountryCode = parts[0];
  } else {
    // Otherwise fallback to default
    newCountryCode = defaultCountry === "AE" ? "+971" : "+1";
  }
 }
  setCountryCode(newCountryCode);
  }
}, [value]);

  // Handle input change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value.replace(/\s+/g, "");
    setPhoneNumber(newNumber);
    const fullValue = countryCode ? `${countryCode}-${newNumber}` : newNumber;

    onChange?.(fullValue);
  };

  // Handle country select change
  const handleCountryChange = (newCode: string) => {
    // if(newCode==="")newCode = defaultCountry === "AE" ? "+971" : "+1";
    if(newCode!=="") {
    setCountryCode(newCode);
    const fullValue = newCode ? `${newCode}-${phoneNumber}` : phoneNumber;
    onChange?.(fullValue);
    }
  };

  return (
    <div className="flex gap-2">
      <Select value={countryCode} onValueChange={handleCountryChange}>
        <SelectTrigger className="w-[100px] border-r-0 border border-gray-500">
          <SelectValue  placeholder={countryCode || (defaultCountry === "AE" ? "+971" : "+1")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="+971">+971</SelectItem>
          <SelectItem value="+1">+1</SelectItem>
          <SelectItem value="+44">+44</SelectItem>
          <SelectItem value="+91">+91</SelectItem>
        </SelectContent>
      </Select>

       <Input
          className="rounded-l-none"
          type="tel" // use text for proper maxLength handling
          value={phoneNumber}
          onChange={handlePhoneChange}
          maxLength={10}
          {...props}
        />
    </div>
  );
}