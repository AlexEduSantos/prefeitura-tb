import { ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

interface BlockHeaderProps {
  title: string;
  route: string;
  button: string;
}
export function BlockHeader({ title, route, button }: BlockHeaderProps) {
  const router = useRouter();

  return (
    <div className="w-full flex items-center gap-2">
      <span className="h-5 w-1.5 bg-primary rounded-full" />
      <h3 className="uppercase text-nowrap tracking-widest text-sm">{title}</h3>
      <span className="w-full h-px bg-muted-foreground/20 rounded-full" />
      <Button
        variant="ghost"
        className="text-xs text-primary text-nowrap hover:font-semibold hover:scale-105 hover:text-primary group transition-all duration-300 px-0 cursor-pointer"
        onClick={() => router.push(route)}
      >
        {button} <ChevronRight />
      </Button>
    </div>
  );
}
