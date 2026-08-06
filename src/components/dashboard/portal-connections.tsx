import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PORTAL_REGISTRY } from "@/lib/portals/registry";
import { ApiKeyConnectForm } from "./api-key-connect-form";
import type { PortalConnection } from "@/generated/prisma/client";

export function PortalConnections({
  connections,
}: {
  connections: Pick<PortalConnection, "portal">[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {PORTAL_REGISTRY.map(({ key, portal, label, description, available, authType }) => {
        const connected = available && connections.some((c) => c.portal === portal);
        return (
          <Card key={key} className={!available ? "border-dashed" : undefined}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{label}</CardTitle>
              {available ? (
                <Badge variant={connected ? "default" : "secondary"}>
                  {connected ? "Connected" : "Not connected"}
                </Badge>
              ) : (
                <Badge variant="outline">Coming soon</Badge>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">{description}</p>
              {!available && (
                <Button variant="outline" size="sm" className="w-fit" disabled>
                  Connect {label}
                </Button>
              )}
              {available && authType === "oauth" && (
                <Button
                  variant={connected ? "outline" : "default"}
                  size="sm"
                  className="w-fit"
                  nativeButton={false}
                  render={<a href={`/api/portals/${key}/authorize`} />}
                >
                  {connected ? "Reconnect" : "Connect"} {label}
                </Button>
              )}
              {available && authType === "api_key" && (
                <ApiKeyConnectForm portalKey={key} connected={connected} label={label} />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
