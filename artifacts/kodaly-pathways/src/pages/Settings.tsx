import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useGetCurrentUser, useLogout, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, LogOut } from "lucide-react";

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { data } = useGetCurrentUser();
  const logout = useLogout();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold flex items-center gap-2"><Settings className="w-6 h-6 text-primary" /> Settings</h1>
      <Card>
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><div className="text-xs text-muted-foreground">Name</div><div className="font-medium">{data?.user?.name || "—"}</div></div>
          <div><div className="text-xs text-muted-foreground">Email</div><div className="font-medium">{data?.user?.email || "—"}</div></div>
          <Button variant="destructive" onClick={() => logout.mutate(undefined, {
            onSuccess: async () => {
              await qc.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
              navigate("/login");
            },
          })} data-testid="button-logout"><LogOut className="w-4 h-4 mr-1" /> Sign out</Button>
        </CardContent>
      </Card>
    </div>
  );
}
