"use client";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
const chartConfig = {
    scans: {
        label: "Scans",
        color: "var(--chart-1)",
    },
};
export function ScanChart({ data }) {
    return (<ChartContainer config={chartConfig} className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false}/>
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }}/>
          <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false}/>
          <ChartTooltip content={<ChartTooltipContent />}/>
          <Area type="monotone" dataKey="scans" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.2} strokeWidth={2}/>
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>);
}
