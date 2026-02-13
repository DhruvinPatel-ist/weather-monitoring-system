// components/Enlarger/chartUtils.ts

interface DataPoint {
  time: string;
  fullTime?: string;
  value: number;
}

interface Series {
  siteName: string;
  data: DataPoint[];
}

export function processChartData(
  data: DataPoint[] = [],
  series?: Series[]
): any[] {
  if (series && series.length > 0) {
    // Multi-series: merge data by index
    return series[0].data.map((item, index) => {
      const point: Record<string, any> = {
        time: item.time,
        fullTime: item.fullTime,
      };
      series.forEach((s) => {
        point[s.siteName] = s.data[index]?.value ?? null;
      });
      return point;
    });
  }

  // Single series (default)
  return data;
}

export function calculateLimits(
  data: DataPoint[] = [],
  series?: Series[]
): { min: number; max: number } {
  let allValues: number[] = [];

  if (series && series.length > 0) {
    series.forEach((s) => {
      allValues.push(...s.data.map((d) => d.value));
    });
  } else {
    allValues = data.map((d) => d.value);
  }

  const min = Math.min(...allValues);
  const max = Math.max(...allValues);

  return {
    min: isFinite(min) ? min : 0,
    max: isFinite(max) ? max : 0,
  };
}

export function getXAxisTickProps(
  data: { fullTime: string }[],
  timeframe?: "live" | "lastDay" | "lastWeek" | "lastMonth" | "lastYear"
) {
  if (!data || data.length === 0) return undefined;

  const dataLength = data.length;
  if (dataLength === 1) {
    return {
      dataKey: "fullTime",
      interval: 0,
      tickFormatter: (ft: string) => ft,
    };
  }

  // Fast date/time extraction without parsing
  const getDateFromFullTime = (ft: string) => ft.split(" ")[0];
  const getTimeFromFullTime = (ft: string) => ft.split(" ")[1];
  const getHourFromTime = (time: string) => parseInt(time.split(":")[0]);
  const getMinuteFromTime = (time: string) => parseInt(time.split(":")[1]);

  // TIMEFRAME-BASED LOGIC (Dashboard Mode)
  if (timeframe) {
    switch (timeframe) {
      case "live": {
        // Live: 15-minute data for last 24 hours
        // Show every 2-4 hours to avoid crowding
        const step = Math.max(1, Math.floor(dataLength / 8)); // ~8 ticks

        return {
          dataKey: "fullTime",
          interval: step - 1,
          tickFormatter: (ft: string) => {
            const time = getTimeFromFullTime(ft);
            const hour = getHourFromTime(time);
            const minute = getMinuteFromTime(time);

            // Show hour marks (00:00, 03:00, 06:00, etc.)
            if (minute === 0 && hour % 3 === 0) {
              return time;
            }
            return time;
          },
        };
      }

      case "lastDay": {
        // Last Day: 1-hour average, 24 points
        // Show every 3-4 hours
        const step = Math.max(1, Math.floor(dataLength / 8)); // ~8 ticks

        return {
          dataKey: "fullTime",
          interval: step - 1,
          tickFormatter: (ft: string) => {
            const time = getTimeFromFullTime(ft);
            const hour = getHourFromTime(time);

            // Show 3-hour intervals
            if (hour % 3 === 0) {
              return time;
            }
            return time;
          },
        };
      }

      case "lastWeek": {
        // Last Week: 1-hour average, 168 points (7 days)
        // Calculate strategic spacing to show ~10-15 total ticks
        const targetTicks = Math.min(
          15,
          Math.max(8, Math.floor(dataLength / 12))
        );
        const baseStep = Math.floor(dataLength / targetTicks);

        const getDayName = (dateStr: string) => {
          const [dd, mm, yyyy] = dateStr.split("-").map(Number);
          const date = new Date(yyyy, mm - 1, dd);
          const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          return days[date.getDay()];
        };

        // Pre-calculate which indices should show day names vs times
        const tickStrategy: { [index: number]: "day" | "time" | "hide" } = {};
        const seenDates = new Set<string>();

        // First pass: mark day boundaries
        for (let i = 0; i < dataLength; i += baseStep) {
          const actualIndex = Math.min(i, dataLength - 1);
          const ft = data[actualIndex].fullTime;
          const date = getDateFromFullTime(ft);

          if (!seenDates.has(date)) {
            tickStrategy[actualIndex] = "day";
            seenDates.add(date);
          } else {
            const time = getTimeFromFullTime(ft);
            const hour = getHourFromTime(time);
            // Show key time intervals
            if (hour === 6 || hour === 12 || hour === 18) {
              tickStrategy[actualIndex] = "time";
            } else {
              tickStrategy[actualIndex] = "hide";
            }
          }
        }

        return {
          dataKey: "fullTime",
          interval: baseStep - 1,
          tickFormatter: (ft: string, index: number) => {
            const strategy = tickStrategy[index];

            if (strategy === "day") {
              const date = getDateFromFullTime(ft);
              const day = date.split("-")[0];
              const dayName = getDayName(date);
              return `${day} ${dayName}`;
            } else if (strategy === "time") {
              return getTimeFromFullTime(ft);
            }

            return ""; // Hide this tick
          },
        };
      }

      case "lastMonth": {
        // Last Month: 1-hour average, ~720 points (30 days)
        // Show weekly intervals
        const step = Math.max(1, Math.floor(dataLength / 8)); // ~8 ticks

        return {
          dataKey: "fullTime",
          interval: step - 1,
          tickFormatter: (ft: string) => {
            const date = getDateFromFullTime(ft);
            const [dd, mm] = date.split("-");
            const months = [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ];
            return `${dd} ${months[parseInt(mm) - 1]}`;
          },
        };
      }

      case "lastYear": {
        // Last Year: Daily average, 365 points
        // Show monthly intervals
        const step = Math.max(1, Math.floor(dataLength / 12)); // ~12 ticks

        return {
          dataKey: "fullTime",
          interval: step - 1,
          tickFormatter: (ft: string) => {
            const date = getDateFromFullTime(ft);
            const [mm, yyyy] = date.split("-");
            const months = [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ];
            return `${months[parseInt(mm) - 1]} ${yyyy}`;
          },
        };
      }

      default:
        // Fall through to automatic detection
        break;
    }
  }

  // AUTOMATIC DETECTION LOGIC (Original Logic)
  // Count unique dates (fast)
  const uniqueDates = new Set();
  const dateChangeIndices = [0];
  let currentDate = getDateFromFullTime(data[0].fullTime);

  for (let i = 1; i < dataLength; i++) {
    const date = getDateFromFullTime(data[i].fullTime);
    uniqueDates.add(date);
    if (date !== currentDate) {
      dateChangeIndices.push(i);
      currentDate = date;
    }
  }
  uniqueDates.add(getDateFromFullTime(data[0].fullTime));

  const dayCount = uniqueDates.size;

  // ONE DAY: Show center with date, others time only
  if (dayCount === 1) {
    const centerIndex = Math.floor(dataLength / 2);
    const step = Math.max(1, Math.floor(dataLength / 12)); // Max 12 ticks

    return {
      dataKey: "fullTime",
      interval: step - 1,
      tickFormatter: (ft: string, index: number) => {
        if (index === centerIndex) {
          return ft; // Show full date-time for center
        }
        return getTimeFromFullTime(ft); // Show only time
      },
    };
  }

  // TWO DAYS: Show date at day boundaries, time for others
  if (dayCount === 2) {
    const step = Math.max(1, Math.floor(dataLength / 10)); // Max 10 ticks

    return {
      dataKey: "fullTime",
      interval: step - 1,
      tickFormatter: (ft: string, index: number) => {
        // Show full datetime for first occurrence of each day
        if (dateChangeIndices.includes(index) || index === 0) {
          return ft;
        }

        // Show time with 2-hour intervals
        const hour = getHourFromTime(getTimeFromFullTime(ft));
        if (hour % 2 === 0) {
          return getTimeFromFullTime(ft);
        }

        return getTimeFromFullTime(ft);
      },
    };
  }

  // WEEK DATA (3-7 days): Show day abbreviation with date
  if (dayCount <= 7) {
    const getDayName = (dateStr: string) => {
      const [dd, mm, yyyy] = dateStr.split("-").map(Number);
      const date = new Date(yyyy, mm - 1, dd);
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return days[date.getDay()];
    };

    // Calculate proper spacing to avoid overcrowding
    const targetTicks = Math.min(15, Math.max(8, dayCount * 2)); // ~2 ticks per day max
    const step = Math.max(1, Math.floor(dataLength / targetTicks));

    const shownDays = new Set();

    return {
      dataKey: "fullTime",
      interval: step - 1,
      tickFormatter: (ft: string) => {
        const date = getDateFromFullTime(ft);
        const time = getTimeFromFullTime(ft);
        const hour = getHourFromTime(time);

        // Show day name for first occurrence of each day
        if (!shownDays.has(date)) {
          shownDays.add(date);
          const day = date.split("-")[0];
          const dayName = getDayName(date);
          return `${day} ${dayName}`;
        }

        // Show key time intervals only (reduce frequency)
        if (hour === 6 || hour === 18) {
          // Only morning and evening
          return time;
        }

        return ""; // Hide other ticks
      },
    };
  }

  // MONTH DATA (8-30 days): Weekly sampling
  if (dayCount <= 30) {
    const weeklyStep = Math.max(1, Math.floor(dataLength / 8)); // ~8 ticks

    return {
      dataKey: "fullTime",
      interval: weeklyStep - 1,
      tickFormatter: (ft: string) => {
        const date = getDateFromFullTime(ft);
        const [dd, mm] = date.split("-");
        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        return `${dd} ${months[parseInt(mm) - 1]}`;
      },
    };
  }

  // QUARTER DATA (31-90 days): Bi-weekly sampling
  if (dayCount <= 90) {
    const step = Math.max(1, Math.floor(dataLength / 6)); // ~6 ticks

    return {
      dataKey: "fullTime",
      interval: step - 1,
      tickFormatter: (ft: string) => {
        const date = getDateFromFullTime(ft);
        const [dd, mm, yyyy] = date.split("-");
        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        return `${dd} ${months[parseInt(mm) - 1]} ${yyyy}`;
      },
    };
  }

  // YEAR+ DATA: Monthly sampling
  const monthlyStep = Math.max(1, Math.floor(dataLength / 12)); // ~12 ticks

  return {
    dataKey: "fullTime",
    interval: monthlyStep - 1,
    tickFormatter: (ft: string) => {
      const date = getDateFromFullTime(ft);
      const [ mm, yyyy] = date.split("-");
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return `${months[parseInt(mm) - 1]} ${yyyy}`;
    },
  };
}
