import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  views: number;
}

type DateRange = "today" | "7d" | "30d" | "90d" | "custom";

interface AnalyticsChartProps {
  data: DataPoint[];
  title: string;
  description?: string;
  onDateRangeChange?: (range: DateRange, startDate?: Date, endDate?: Date) => void;
}

export function AnalyticsChart({
  data,
  title,
  description,
  onDateRangeChange,
}: AnalyticsChartProps) {
  const [selectedRange, setSelectedRange] = useState<DateRange>("30d");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);

  const handleRangeChange = (range: DateRange) => {
    setSelectedRange(range);
    if (range !== "custom") {
      setStartDate(undefined);
      setEndDate(undefined);
      onDateRangeChange?.(range);
    }
  };

  const handleCustomDateChange = (type: "start" | "end", date: Date | undefined) => {
    if (type === "start") {
      setStartDate(date);
      setIsStartOpen(false);
      if (date && endDate) {
        onDateRangeChange?.("custom", date, endDate);
      }
    } else {
      setEndDate(date);
      setIsEndOpen(false);
      if (startDate && date) {
        onDateRangeChange?.("custom", startDate, date);
      }
    }
  };

  const rangeButtons: { label: string; value: DateRange }[] = [
    { label: "Today", value: "today" },
    { label: "7d", value: "7d" },
    { label: "30d", value: "30d" },
    { label: "90d", value: "90d" },
    { label: "Custom", value: "custom" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {rangeButtons.map((btn) => (
              <Button
                key={btn.value}
                variant={selectedRange === btn.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleRangeChange(btn.value)}
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </div>
        {selectedRange === "custom" && (
          <div className="flex flex-wrap items-center gap-2 pt-4">
            <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-[140px] justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "MMM d, yyyy") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => handleCustomDateChange("start", date)}
                  disabled={(date) => (endDate ? date > endDate : false) || date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <span className="text-sm text-muted-foreground">to</span>
            <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-[140px] justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "MMM d, yyyy") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => handleCustomDateChange("end", date)}
                  disabled={(date) => (startDate ? date < startDate : false) || date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickMargin={8}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toLocaleString()}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                labelStyle={{
                  color: "hsl(var(--popover-foreground))",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
                itemStyle={{
                  color: "hsl(var(--popover-foreground))",
                }}
                formatter={(value: number) => [value.toLocaleString(), "Views"]}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#viewsGradient)"
                dot={false}
                activeDot={{
                  r: 6,
                  fill: "hsl(var(--primary))",
                  stroke: "hsl(var(--background))",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
