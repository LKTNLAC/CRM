import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useRoles } from "../services";

export default function RolesListPage() {
  const { data: roles = [], isLoading } = useRoles();

  return (
    <div>
      <PageHeader title="Phân quyền" description="Danh sách vai trò và quyền trong hệ thống" />
      <div className="grid gap-3 md:grid-cols-2">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {role.name}
                <Badge variant="outline" className="text-[10px] font-mono ml-auto">{role.code}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">{role.permissions.length} quyền</p>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {role.permissions.slice(0, 20).map((p) => (
                  <span key={p} className="text-[10px] font-mono bg-secondary px-1.5 py-0.5 rounded">{p}</span>
                ))}
                {role.permissions.length > 20 && (
                  <span className="text-[10px] text-muted-foreground">+{role.permissions.length - 20} khác</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}