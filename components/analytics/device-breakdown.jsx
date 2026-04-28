"use client";
import { Cell, Pie, PieChart, ResponsiveContainer, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
const chartConfig = {
    value: {
        label: "Scans",
    },
    Mobile: {
        label: "Mobile",
        color: "var(--chart-1)",
    },
    Desktop: {
        label: "Desktop",
        color: "var(--chart-2)",
    },
    Other: {
        label: "Other",
        color: "var(--chart-3)",
    },
};
export function DeviceBreakdown({ data }) {
    return (<ChartContainer config={chartConfig} className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent />}/>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2}>
            {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill}/>))}
          </Pie>
          <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-sm">{value}</span>}/>
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>);
}
