import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatsCard({ title, value, description, icon, trend, highlight }: {
  title: string; value: string; description?: string; icon: React.ReactNode; trend?: string; highlight?: boolean;
}) {
  return (
    <Card className={`bg-card/50 ${highlight ? "border-primary/30 bg-primary/5" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={highlight ? "text-primary" : "text-muted-foreground"}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2">
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
          {trend && <span className="text-xs text-primary flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />{trend}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
