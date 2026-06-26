import { EllipsisVertical } from "lucide-react";
import { Button } from "../ui/button";

export function CustomDrawerItem({ name }: { name: string }) {
  return (
    <Button variant="drag">
      {name} <EllipsisVertical />
    </Button>
  );
}
