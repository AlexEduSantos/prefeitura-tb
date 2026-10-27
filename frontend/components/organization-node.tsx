import { NodeProps, Node, Handle, Position } from "@xyflow/react";
import { IOrganization } from "@/app/type/organization";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Layers,
  FolderTree,
  FileText,
  Users,
  Compass,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Tipo do nó para o React Flow
export type OrganizationNodeType = Node<
  {
    org: IOrganization;
    onAddChild: (id: IOrganization) => void;
    onEdit: (org: IOrganization) => void;
    onDelete: (org: string) => void;
  },
  "organization"
>;

const TYPE_CONFIG: Record<
  string,
  {
    label: string;
    badgeClass: string;
    cardBorder: string;
    cardBg: string;
    icon: React.ElementType;
  }
> = {
  prefeitura: {
    label: "Prefeitura",
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-200",
    cardBorder: "border-blue-400 ring-1 ring-blue-500/10",
    cardBg: "",
    icon: Building2,
  },
  secretaria: {
    label: "Secretaria",
    badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    cardBorder: "border-emerald-400 ring-1 ring-emerald-500/10",
    cardBg: "",
    icon: Layers,
  },
  divisão: {
    label: "Divisão",
    badgeClass: "bg-violet-500/10 text-violet-600 border-violet-200",
    cardBorder: "border-violet-400 ring-1 ring-violet-500/10",
    cardBg: "",
    icon: FolderTree,
  },
  seção: {
    label: "Seção",
    badgeClass: "bg-amber-500/10 text-amber-600 border-amber-200",
    cardBorder: "border-amber-400 ring-1 ring-amber-500/10",
    cardBg: "",
    icon: FileText,
  },
  conselho: {
    label: "Conselho",
    badgeClass: "bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-200",
    cardBorder: "border-fuchsia-400 ring-1 ring-fuchsia-500/10",
    cardBg: "",
    icon: Users,
  },
  projeto: {
    label: "Projeto",
    badgeClass: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
    cardBorder: "border-cyan-400 ring-1 ring-cyan-500/10",
    cardBg: "",
    icon: Compass,
  },
};

export function OrganizationNode({ data }: NodeProps<OrganizationNodeType>) {
  const { org, onAddChild, onEdit, onDelete } = data;
  const cfg = TYPE_CONFIG[org.type] ?? {
    label: org.type,
    badgeClass: "bg-muted",
    cardBorder: "border-border",
    cardBg: "bg-card",
    icon: Building2,
  };
  const IconComp = cfg.icon;

  return (
    <div
      className={cn(
        "group relative flex w-56 flex-col gap-2 rounded-lg bg-card p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:ring-primary/30",
        cfg.cardBorder,
        cfg.cardBg,
        org.active ? "" : "opacity-40",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="bg-border! w-2! h-2!"
      />
      <div className="flex items-center justify-between gap-2">
        <Badge
          variant="outline"
          className={cn(
            "capitalize font-semibold text-[8px]! px-1.5 py-0",
            cfg.badgeClass,
          )}
        >
          <IconComp className="mr-1 size-2.5" />
          {cfg.label}
        </Badge>
        {org.acronym && (
          <span className="font-mono text-[10px] font-bold text-muted-foreground bg-muted/60 px-1 rounded">
            {org.acronym}
          </span>
        )}
      </div>
      <h2 className="text-xs font-semibold leading-snug tracking-tight text-foreground line-clamp-2 min-h-8 flex items-center">
        {org.title}
      </h2>
      <div className="flex items-center justify-between border-t border-border/60 pt-2">
        {org.active ? (
          <span className="text-xs text-muted-foreground">
            {org.children?.length || 0} subordinadas
          </span>
        ) : (
          <Badge
            variant="destructive"
            className="text-[8px] border-destructive/20"
          >
            Inativo
          </Badge>
        )}
        <div className="flex items-center gap-0.5">
          {org.active && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground hover:bg-primary/10 hover:text-primary nodrag"
              onClick={() => onAddChild(org)}
              title="Adicionar subunidade"
            >
              <Plus className="size-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground hover:bg-muted nodrag"
            onClick={() => onEdit(org)}
            title="Editar"
          >
            <Pencil className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive nodrag"
            onClick={() => onDelete(org.id)}
            title="Excluir"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="bg-border! w-2! h-2!"
      />
    </div>
  );
}
