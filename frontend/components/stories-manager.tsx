"use client";
import { useState, useEffect } from "react";
import { useStories } from "../app/viewmodel/stories.viewmodel";
import { IStories, IStoriesItem } from "@/app/type/stories";
import Image from "next/image";
import { format } from "date-fns";
import {
  PlusIcon,
  Search,
  Trash2,
  GripVertical,
  Pencil,
  EyeIcon,
  Link as LinkIcon,
  MessageSquare,
} from "lucide-react";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { MediaPickerModal } from "./media-picker-modal";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";

import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import { Separator } from "./ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { StoriesViewer } from "./stories-viewer";

// --- Sortable Item ---
function SortableStoryItem({
  item,
  onDelete,
  onEdit,
}: {
  item: IStoriesItem;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-9/16 min-w-34 h-full overflow-hidden rounded-lg group select-none border border-border/50 bg-muted"
    >
      <Image
        loader={() =>
          `${process.env.NEXT_PUBLIC_API_URL}/media/file/${item.media.key}`
        }
        src={`${process.env.NEXT_PUBLIC_API_URL}/media/file/${item.media.key}`}
        alt={item.media.altText || item.caption || "Story item"}
        fill
        className="object-cover object-center pointer-events-none"
      />

      {/* Badges indicativos na parte inferior (se tiver link ou legenda) */}
      <div className="absolute bottom-1 left-1 flex items-center gap-1 z-10 pointer-events-none">
        {item.link && (
          <span
            className="p-1 rounded bg-black/60 text-white backdrop-blur-xs"
            title={`Link: ${item.link}`}
          >
            <LinkIcon className="size-3" />
          </span>
        )}
        {item.caption && (
          <span
            className="p-1 rounded bg-black/60 text-white backdrop-blur-xs"
            title={`Legenda: ${item.caption}`}
          >
            <MessageSquare className="size-3" />
          </span>
        )}
      </div>

      {/* Ações no Hover */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-1 gap-1 z-20">
        <Button
          variant="outline"
          size="icon-sm"
          className="bg-white/95 text-foreground hover:bg-white rounded-full size-7 shadow"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title="Editar legenda e link"
        >
          <Pencil className="size-3.5 stroke-2" />
        </Button>
        <Button
          variant="destructive"
          size="icon-sm"
          className="bg-white/95 text-destructive hover:bg-white rounded-full size-7 shadow"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Excluir item"
        >
          <Trash2 className="size-3.5 stroke-2" />
        </Button>
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-white touch-none"
          title="Reordenar"
        >
          <GripVertical className="size-5" />
        </div>
      </div>
    </div>
  );
}

// --- Story Render ---
function StoryRender({
  story,
  onDeleteStory,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onReorder,
  onViewStory,
  onEditStory,
}: {
  story: IStories;
  onDeleteStory: () => void;
  onAddItem: () => void;
  onEditItem: (item: IStoriesItem) => void;
  onDeleteItem: (itemId: string) => void;
  onReorder: (newOrder: string[]) => void;
  onViewStory: () => void;
  onEditStory: () => void;
}) {
  const [selectedStory, setSelectedStory] = useState<IStories | null>(null);
  const [items, setItems] = useState<IStoriesItem[]>(story.items);

  // Sincroniza itens locais caso mudem externamente (query refetch ou adicionar/remover)
  useEffect(() => {
    setItems(story.items);
  }, [story.items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(items, oldIndex, newIndex);
        setItems(reordered);
        const newOrder = reordered.map((item) => item.id);
        onReorder(newOrder);
      }
    }
  };

  return (
    <Collapsible
      onClick={() => setSelectedStory(story)}
      className="w-full flex flex-col bg-card gap-2 group border-b border-border last:border-0 p-2 rounded-lg shadow"
    >
      <div className="w-full flex flex-col gap-2">
        {/* Usamos asChild com div para não renderizar <button> aninhado com outros <button>s (evitando erro de hidratação) */}
        <CollapsibleTrigger asChild>
          <div className="flex gap-4 h-full cursor-pointer">
            <div className="relative overflow-hidden ring-1 ring-primary border-4 border-transparent rounded-full min-w-24 min-h-24 shrink-0">
              <Image
                loader={() =>
                  `${process.env.NEXT_PUBLIC_API_URL}/media/file/${story.cover.key}`
                }
                src={`${process.env.NEXT_PUBLIC_API_URL}/media/file/${story.cover.key}`}
                alt={story.title}
                fill
                className="object-cover object-center"
              />
            </div>
            {/* informações do destaque e botões */}
            <div className="grid grid-cols-2 gap-2 w-full">
              {/* Informações do destaque */}
              <div className="flex flex-col justify-center items-start">
                <h2 className="text-xl font-semibold">{story.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {story.description}
                </p>
              </div>
              {/* BOTÕES  */}
              <div
                className="transition-all duration-300 h-full items-center hidden group-hover:grid xl:grid-cols-4 grid-cols-2 gap-2 w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="default"
                  className="flex-1 p-0 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddItem();
                  }}
                >
                  <PlusIcon />
                  Novo Item
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-card p-0 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewStory();
                  }}
                >
                  <EyeIcon />
                  Visualizar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-card p-0 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditStory();
                  }}
                >
                  <Pencil />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteStory();
                  }}
                  className="flex-1 p-0 cursor-pointer"
                >
                  <Trash2 />
                  Excluir
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {selectedStory?.id === story.id && (
            <div className="flex flex-col gap-2">
              <Separator />
              <div className="flex-1 overflow-x-auto flex flex-row gap-2 items-stretch py-1">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={items.map((item) => item.id)}
                    strategy={horizontalListSortingStrategy}
                  >
                    {items.map((item) => (
                      <SortableStoryItem
                        key={item.id}
                        item={item}
                        onDelete={() => onDeleteItem(item.id)}
                        onEdit={() => onEditItem(item)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
                <div
                  className="aspect-9/16 min-w-34 min-h-full border-2 border-dashed text-border bg-muted shadow rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={onAddItem}
                  title="Adicionar novo item"
                >
                  <PlusIcon className="size-6 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Novo
                  </span>
                </div>
              </div>
            </div>
          )}
        </CollapsibleContent>
      </div>
      <div className="w-full px-2 group-hover:flex hidden transition-all duration-300 flex-wrap justify-between gap-2 text-xs text-muted-foreground ">
        <p>
          Criado em: {format(new Date(story.createdAt), "dd/MM/yyyy HH:mm")}
        </p>
        <p>
          Imagens ativas:{" "}
          {
            story.items.filter(
              (item) =>
                item.publishedDate === null ||
                item.expirationDate === null ||
                (new Date(item.publishedDate) <= new Date() &&
                  new Date(item.expirationDate) >= new Date()),
            ).length
          }
        </p>
        <p>
          Imagens expiradas:{" "}
          {
            story.items.filter(
              (item) =>
                item.expirationDate &&
                new Date(item.expirationDate) < new Date(),
            ).length
          }
        </p>
        <p>
          Imagens não publicadas:{" "}
          {
            story.items.filter(
              (item) =>
                item.publishedDate && new Date(item.publishedDate) > new Date(),
            ).length
          }
        </p>
        <p>Total de imagens: {story.items.length}</p>
      </div>
    </Collapsible>
  );
}

// --- Toolbar ---

interface ToolbarProps {
  limit: number;
  setLimit: (limit: number) => void;
  search: string;
  setSearch: (search: string) => void;
  openCreateStoryModal: () => void;
}

function Toolbar({
  limit,
  setLimit,
  search,
  setSearch,
  openCreateStoryModal,
}: ToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex-1 w-full sm:w-auto relative">
        <Input
          placeholder="Buscar por título..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
        <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={String(limit)}
          onValueChange={(val) => setLimit(Number(val))}
        >
          <SelectTrigger className="w-20">
            <SelectValue placeholder="10" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openCreateStoryModal} className="cursor-pointer">
          <PlusIcon className="h-4 w-4 mr-2" />
          Novo Destaque
        </Button>
      </div>
    </div>
  );
}

// --- Main Component ---
export function StoriesManager() {
  const {
    storiesQuery,
    isLoadingStories,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    createStoryModalOpen,
    openCreateStoryModal,
    closeCreateStoryModal,
    deleteDialogOpen,
    setDeleteDialogOpen,
    confirmDeleteItem,
    confirmDeleteStory,
    handleDeleteConfirm,
    createStoryMutation,
    updateStoryMutation,
    createStoryItemMutation,
    updateStoryItemMutation,
    handleReorder,
  } = useStories();

  // Estados para criação de story
  const [newStoryTitle, setNewStoryTitle] = useState("");
  const [newStoryDescription, setNewStoryDescription] = useState("");
  const [newStoryCoverId, setNewStoryCoverId] = useState("");
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);

  // Estados para edição de story
  const [editingStory, setEditingStory] = useState<IStories | null>(null);
  const [editStoryTitle, setEditStoryTitle] = useState("");
  const [editStoryDescription, setEditStoryDescription] = useState("");
  const [editStoryCoverId, setEditStoryCoverId] = useState("");
  const [editCoverPickerOpen, setEditCoverPickerOpen] = useState(false);

  // Estados para criação de item do story
  const [createItemModalOpen, setCreateItemModalOpen] = useState(false);
  const [createItemStoryId, setCreateItemStoryId] = useState<string | null>(null);
  const [createItemMedia, setCreateItemMedia] = useState<any | null>(null);
  const [createItemCaption, setCreateItemCaption] = useState("");
  const [createItemLink, setCreateItemLink] = useState("");
  const [createItemMediaPickerOpen, setCreateItemMediaPickerOpen] = useState(false);

  // Estados para edição de item do story
  const [editItemModalOpen, setEditItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IStoriesItem | null>(null);
  const [editItemMedia, setEditItemMedia] = useState<any | null>(null);
  const [editItemCaption, setEditItemCaption] = useState("");
  const [editItemLink, setEditItemLink] = useState("");
  const [editItemMediaPickerOpen, setEditItemMediaPickerOpen] = useState(false);

  const [viewingStory, setViewingStory] = useState<IStories | null>(null);

  const handleCreateStory = () => {
    if (!newStoryTitle || !newStoryCoverId) {
      toast.error("Preencha título e capa");
      return;
    }
    createStoryMutation.mutate({
      title: newStoryTitle,
      description: newStoryDescription || undefined,
      coverId: newStoryCoverId,
    });
    setNewStoryTitle("");
    setNewStoryDescription("");
    setNewStoryCoverId("");
  };

  const handleCoverSelect = (media: any) => {
    const selected = Array.isArray(media) ? media[0] : media;
    setNewStoryCoverId(selected.id);
    setCoverPickerOpen(false);
  };

  const handleOpenEdit = (story: IStories) => {
    setEditingStory(story);
    setEditStoryTitle(story.title || "");
    setEditStoryDescription(story.description || "");
    setEditStoryCoverId(story.coverId || (story.cover as any)?.id || "");
  };

  const handleSaveEdit = () => {
    if (!editingStory) return;
    if (!editStoryTitle.trim() || !editStoryCoverId) {
      toast.error("Preencha título e capa");
      return;
    }
    updateStoryMutation.mutate(
      {
        id: editingStory.id,
        data: {
          title: editStoryTitle,
          description: editStoryDescription || undefined,
          coverId: editStoryCoverId,
        },
      },
      {
        onSuccess: () => {
          setEditingStory(null);
        },
      }
    );
  };

  const handleEditCoverSelect = (media: any) => {
    const selected = Array.isArray(media) ? media[0] : media;
    setEditStoryCoverId(selected.id);
    setEditCoverPickerOpen(false);
  };

  // Abrir modal de criação de item
  const handleOpenCreateItem = (storyId: string) => {
    setCreateItemStoryId(storyId);
    setCreateItemMedia(null);
    setCreateItemCaption("");
    setCreateItemLink("");
    setCreateItemModalOpen(true);
  };

  const handleCreateItemSelectMedia = (media: any) => {
    const selected = Array.isArray(media) ? media[0] : media;
    setCreateItemMedia(selected);
    setCreateItemMediaPickerOpen(false);
  };

  const handleSaveCreateItem = () => {
    if (!createItemStoryId) return;
    if (!createItemMedia) {
      toast.error("Selecione uma imagem ou vídeo para o item");
      return;
    }

    createStoryItemMutation.mutate(
      {
        storyId: createItemStoryId,
        data: {
          mediaId: createItemMedia.id,
          caption: createItemCaption.trim() || undefined,
          link: createItemLink.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setCreateItemModalOpen(false);
          setCreateItemStoryId(null);
          setCreateItemMedia(null);
          setCreateItemCaption("");
          setCreateItemLink("");
        },
      }
    );
  };

  // Abrir modal de edição de item
  const handleOpenEditItem = (item: IStoriesItem) => {
    setEditingItem(item);
    setEditItemMedia(item.media);
    setEditItemCaption(item.caption || "");
    setEditItemLink(item.link || "");
    setEditItemModalOpen(true);
  };

  const handleEditItemSelectMedia = (media: any) => {
    const selected = Array.isArray(media) ? media[0] : media;
    setEditItemMedia(selected);
    setEditItemMediaPickerOpen(false);
  };

  const handleSaveEditItem = () => {
    if (!editingItem) return;

    updateStoryItemMutation.mutate(
      {
        id: editingItem.id,
        data: {
          mediaId: editItemMedia?.id,
          caption: editItemCaption.trim() || null,
          link: editItemLink.trim() || null,
        },
      },
      {
        onSuccess: () => {
          setEditItemModalOpen(false);
          setEditingItem(null);
        },
      }
    );
  };

  if (isLoadingStories) {
    return (
      <div className="p-4">
        <Toolbar
          limit={limit}
          setLimit={setLimit}
          search={search}
          setSearch={setSearch}
          openCreateStoryModal={openCreateStoryModal}
        />
        <p>Carregando destaques...</p>
      </div>
    );
  }

  const { data: stories, totalPages } = storiesQuery || {
    data: [],
    total: 0,
    totalPages: 0,
  };

  return (
    <div className="w-full space-y-4">
      {/* Visualizador de Stories (Portal Overlay) */}
      <StoriesViewer
        stories={viewingStory}
        open={!!viewingStory}
        onClose={() => setViewingStory(null)}
      />

      {/* Toolbar */}
      <Toolbar
        limit={limit}
        setLimit={setLimit}
        search={search}
        setSearch={setSearch}
        openCreateStoryModal={openCreateStoryModal}
      />

      {/* Lista */}
      <div className="flex flex-col gap-4">
        {stories && stories.length > 0 ? (
          stories.map((story: IStories) => (
            <StoryRender
              key={story.id}
              story={story}
              onDeleteStory={() => confirmDeleteStory(story.id)}
              onAddItem={() => handleOpenCreateItem(story.id)}
              onEditItem={(item) => handleOpenEditItem(item)}
              onDeleteItem={(itemId) => confirmDeleteItem(story.id, itemId)}
              onReorder={(newOrder) => handleReorder(story.id, newOrder)}
              onViewStory={() => setViewingStory(story)}
              onEditStory={() => handleOpenEdit(story)}
            />
          ))
        ) : (
          <div className="text-center text-muted-foreground py-10">
            Nenhum destaque encontrado.
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="flex items-center text-sm">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      )}

      {/* Modal de criação do Story */}
      <Dialog open={createStoryModalOpen} onOpenChange={closeCreateStoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Destaque</DialogTitle>
            <DialogDescription>
              Crie um novo grupo de destaques para organizar seus stories.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título *</label>
              <Input
                value={newStoryTitle}
                onChange={(e) => setNewStoryTitle(e.target.value)}
                placeholder="Título do destaque"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Input
                value={newStoryDescription}
                onChange={(e) => setNewStoryDescription(e.target.value)}
                placeholder="Descrição (opcional)"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Capa *</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setCoverPickerOpen(true)}
                >
                  {newStoryCoverId ? "Trocar capa" : "Selecionar capa"}
                </Button>
                {newStoryCoverId && (
                  <span className="text-sm text-muted-foreground">
                    Capa selecionada
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={closeCreateStoryModal}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateStory}
              disabled={createStoryMutation.isPending}
            >
              {createStoryMutation.isPending ? "Criando..." : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de edição do Story */}
      <Dialog
        open={!!editingStory}
        onOpenChange={(open) => {
          if (!open) setEditingStory(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Destaque</DialogTitle>
            <DialogDescription>
              Atualize as informações e a capa deste destaque.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título *</label>
              <Input
                value={editStoryTitle}
                onChange={(e) => setEditStoryTitle(e.target.value)}
                placeholder="Título do destaque"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Input
                value={editStoryDescription}
                onChange={(e) => setEditStoryDescription(e.target.value)}
                placeholder="Descrição (opcional)"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Capa *</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setEditCoverPickerOpen(true)}
                >
                  {editStoryCoverId ? "Trocar capa" : "Selecionar capa"}
                </Button>
                {editStoryCoverId && (
                  <span className="text-sm text-muted-foreground">
                    Capa selecionada
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setEditingStory(null)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateStoryMutation.isPending}
            >
              {updateStoryMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Criação de Item do Story */}
      <Dialog
        open={createItemModalOpen}
        onOpenChange={(open) => {
          if (!open) setCreateItemModalOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Item ao Destaque</DialogTitle>
            <DialogDescription>
              Selecione a mídia e adicione legenda ou link de acesso (opcionais).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Mídia *</label>
              <div className="flex items-center gap-3 mt-1.5">
                {createItemMedia ? (
                  <div className="relative w-16 aspect-9/16 rounded overflow-hidden border border-border">
                    <Image
                      loader={() =>
                        `${process.env.NEXT_PUBLIC_API_URL}/media/file/${createItemMedia.key}`
                      }
                      src={`${process.env.NEXT_PUBLIC_API_URL}/media/file/${createItemMedia.key}`}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateItemMediaPickerOpen(true)}
                >
                  {createItemMedia ? "Trocar mídia" : "Selecionar mídia da galeria"}
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Legenda (Caption)</label>
              <Input
                value={createItemCaption}
                onChange={(e) => setCreateItemCaption(e.target.value)}
                placeholder="Ex: Confira os novos eventos da nossa cidade..."
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Exibida na parte inferior do visualizador.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Link de Redirecionamento</label>
              <div className="relative mt-1">
                <Input
                  value={createItemLink}
                  onChange={(e) => setCreateItemLink(e.target.value)}
                  placeholder="https://exemplo.com.br"
                  className="pl-8"
                />
                <LinkIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Desktop: aberto via botão com ChevronUp. Mobile: aberto ao arrastar para cima (bottom-to-top).
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setCreateItemModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveCreateItem}
              disabled={createStoryItemMutation.isPending || !createItemMedia}
            >
              {createStoryItemMutation.isPending ? "Adicionando..." : "Adicionar Item"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Item do Story */}
      <Dialog
        open={editItemModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditItemModalOpen(false);
            setEditingItem(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Item do Destaque</DialogTitle>
            <DialogDescription>
              Altere a legenda, o link de acesso ou a mídia deste item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Mídia</label>
              <div className="flex items-center gap-3 mt-1.5">
                {editItemMedia ? (
                  <div className="relative w-16 aspect-9/16 rounded overflow-hidden border border-border">
                    <Image
                      loader={() =>
                        `${process.env.NEXT_PUBLIC_API_URL}/media/file/${editItemMedia.key}`
                      }
                      src={`${process.env.NEXT_PUBLIC_API_URL}/media/file/${editItemMedia.key}`}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditItemMediaPickerOpen(true)}
                >
                  Trocar mídia da galeria
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Legenda (Caption)</label>
              <Input
                value={editItemCaption}
                onChange={(e) => setEditItemCaption(e.target.value)}
                placeholder="Ex: Confira os novos eventos da nossa cidade..."
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Exibida na parte inferior do visualizador.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Link de Redirecionamento</label>
              <div className="relative mt-1">
                <Input
                  value={editItemLink}
                  onChange={(e) => setEditItemLink(e.target.value)}
                  placeholder="https://exemplo.com.br"
                  className="pl-8"
                />
                <LinkIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Desktop: aberto via botão com ChevronUp. Mobile: aberto ao arrastar para cima (bottom-to-top).
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setEditItemModalOpen(false);
                setEditingItem(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEditItem}
              disabled={updateStoryItemMutation.isPending}
            >
              {updateStoryItemMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Media Picker para capa (criação) */}
      <MediaPickerModal
        isOpen={coverPickerOpen}
        onClose={() => setCoverPickerOpen(false)}
        onSelect={handleCoverSelect}
        multiple={false}
      />

      {/* Media Picker para capa (edição) */}
      <MediaPickerModal
        isOpen={editCoverPickerOpen}
        onClose={() => setEditCoverPickerOpen(false)}
        onSelect={handleEditCoverSelect}
        multiple={false}
      />

      {/* Media Picker para novo item */}
      <MediaPickerModal
        isOpen={createItemMediaPickerOpen}
        onClose={() => setCreateItemMediaPickerOpen(false)}
        onSelect={handleCreateItemSelectMedia}
        multiple={false}
      />

      {/* Media Picker para editar item */}
      <MediaPickerModal
        isOpen={editItemMediaPickerOpen}
        onClose={() => setEditItemMediaPickerOpen(false)}
        onSelect={handleEditItemSelectMedia}
        multiple={false}
      />

      {/* Alert Dialog para confirmação */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este item? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
