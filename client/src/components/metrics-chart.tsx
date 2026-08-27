
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricData {
  label: string;
  value: number;
  previousValue?: number;
}

interface MetricsChartProps {
  title: string;
  description?: string;
  data: MetricData[];
  type?: "bar" | "line";
}

export function MetricsChart({ title, description, data, type = "bar" }: MetricsChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => {
            const percentage = (item.value / maxValue) * 100;
            const change = item.previousValue
              ? ((item.value - item.previousValue) / item.previousValue) * 100
              : null;
            const isPositive = change !== null && change > 0;

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{item.value.toLocaleString()}</span>
                    {change !== null && (
                      <span
                        className={cn(
                          "flex items-center gap-1 text-xs",
                          isPositive ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {isPositive ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(change).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
