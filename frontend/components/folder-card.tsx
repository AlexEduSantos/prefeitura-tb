import { Card } from "@/components/ui/card";
import { Folder } from "lucide-react"; // Instale lucide-react se não tiver

interface FolderCardProps {
  name: string;
  onClick: () => void;
}

export const FolderCard = ({ name, onClick }: FolderCardProps) => {
  return (
    <Card
      className="p-4 flex flex-col items-center gap-3 cursor-pointer hover:ring hover:ring-primary hover:ring-offset-1 hover:-translate-y-1 shadow-none hover:shadow-lg transition-all aspect-square justify-center"
      onClick={onClick}
    >
      <Folder className="text-primary fill-primary" size={24} />
      <span className="font-medium text-sm truncate capitalize">{name}</span>
    </Card>
  );
};
