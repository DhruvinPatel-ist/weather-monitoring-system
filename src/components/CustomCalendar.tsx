"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalendarProps {
  month?: number;
  year?: number;
  selected?: Date;
  startDate?: Date;
  endDate?: Date;
  disableFuture?: boolean;
  onSelect?: (date: Date) => void;
  className?: string;
}

export function Calendar({
  month = new Date().getMonth(),
  year = new Date().getFullYear(),
  selected = new Date(),
  startDate,
  endDate,
  disableFuture = false,
  onSelect,
  className,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(month);
  const [currentYear, setCurrentYear] = React.useState(year);

  // Days of the week
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get day of week for first day of month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Format month name
  const formatMonth = (month: number, year: number) => {
    return new Date(year, month).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  };

  // Previous month
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // Next month
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Handle date selection
  const handleDateClick = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    onSelect?.(newDate);
  };

  // Generate calendar grid
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const calendarMatrix: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      currentWeek.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        calendarMatrix.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      calendarMatrix.push(currentWeek);
    }

    return calendarMatrix.map((week, weekIndex) => (
      <tr key={`week-${weekIndex}`}>
        {week.map((day, dayIndex) => {
          const dateObj =
            day !== null ? new Date(currentYear, currentMonth, day) : null;
          const isFuture = dateObj && dateObj.getTime() > today.getTime();

          const isSelected =
            dateObj &&
            selected &&
            dateObj.toDateString() === selected.toDateString();

          const isInRange =
            dateObj &&
            startDate &&
            endDate &&
            dateObj.getTime() >= startDate.getTime() &&
            dateObj.getTime() <= endDate.getTime();

          return (
            <td
              key={`day-${weekIndex}-${dayIndex}`}
              className="p-0 text-center"
            >
              {day !== null ? (
                <Button
                  disabled={!!(disableFuture && isFuture)}
                  variant="ghost"
                  className={cn(
                    "h-8 w-8 p-1 font-normal rounded-md",
                    isSelected && "bg-[#009fac] text-white hover:bg-[#009fac]",
                    !isSelected && isInRange && "bg-[#e0f7f9]"
                  )}
                  onClick={() => handleDateClick(day)}
                >
                  {day}
                </Button>
              ) : (
                <div className="h-9 w-9" />
              )}
            </td>
          );
        })}
      </tr>
    ));
  };

  return (
    <div className={cn("p-3 select-none", className)}>
      {/* Header with month/year and navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 bg-transparent p-0"
          onClick={prevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium">
          {formatMonth(currentMonth, currentYear)}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 bg-transparent p-0"
          onClick={nextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar table */}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {daysOfWeek.map((day) => (
              <th
                key={day}
                className="text-muted-foreground text-[0.8rem] font-normal text-center p-1"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{renderCalendar()}</tbody>
      </table>
    </div>
  );
}
