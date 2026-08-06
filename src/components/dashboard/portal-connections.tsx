import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PortalConnection } from "@/generated/prisma/client";

const PORTALS = [
  { key: "coupa", portal: "COUPA", label: "Coupa" },
  { key: "ariba", portal: "ARIBA", label: "Ariba" },
] as const;

export function PortalConnections({
  connections,
}: {
  connections: Pick<PortalConnection, "portal">[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {PORTALS.map(({ key, portal, label }) => {
        const connected = connections.some((c) => c.portal === portal);
        return (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{label}</CardTitle>
              <Badge variant={connected ? "default" : "secondary"}>
                {connected ? "Connected" : "Not connected"}
              </Badge>
            </CardHeader>
            <CardContent>
              <Button
                variant={connected ? "outline" : "default"}
                size="sm"
                render={<a href={`/api/portals/${key}/authorize`} />}
              >
                {connected ? "Reconnect" : "Connect"} {label}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
