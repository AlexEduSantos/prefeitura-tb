// components/organization-manager.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  Node,
  Edge,
  ReactFlow,
  useNodesState,
  useEdgesState,
  Connection,
  reconnectEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import { useOrganizationViewModel } from "@/app/viewmodel/organization.viewmodel";
import { IOrganization } from "@/app/type/organization";
import { OrganizationNode } from "./organization-node";
import { RemovableEdge } from "./removable-edge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { OrganizationModal } from "./organization-modal";

const nodeWidth = 224;
const nodeHeight = 110;
const nodeTypes = { organization: OrganizationNode };
const edgeTypes = { removable: RemovableEdge };

const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction = "TB",
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const convertTreeToFlow = (
  orgs: IOrganization[],
): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const traverse = (orgList: IOrganization[]) => {
    orgList.forEach((org) => {
      nodes.push({
        id: org.id,
        type: "organization",
        data: { org },
        position: { x: 0, y: 0 },
      });

      if (org.children && org.children.length > 0) {
        org.children.forEach((child) => {
          edges.push({
            id: `e-${org.id}-${child.id}`,
            source: org.id,
            target: child.id,
            type: "removable",
            reconnectable: "target",
            style: { stroke: "#e2e8f0", strokeWidth: 1.5 },
          });
        });
        traverse(org.children);
      }
    });
  };

  traverse(orgs);
  return { nodes, edges };
};

export function OrganizationManager() {
  const {
    organizationsTree,
    isLoadingOrganizations,
    open,
    setOpen,
    currentOrg,
    setCurrentOrg,
    modalMode,
    parentOrg,
    handleAddChild,
    handleEdit,
    handleDelete,
    handleCloseModal,
    handleSubmitModal,
    changeParent,
  } = useOrganizationViewModel();

  const [searchTerm, setSearchTerm] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const edgeReconnectSuccessful = useRef(true);

  // Filtra a árvore com base na busca
  const filterTree = useCallback(
    (list: IOrganization[], query: string): IOrganization[] => {
      if (!query.trim()) return list;
      const lower = query.toLowerCase();
      return list.reduce<IOrganization[]>((acc, node) => {
        const matches =
          node.title.toLowerCase().includes(lower) ||
          node.acronym?.toLowerCase().includes(lower);
        const filteredChildren = node.children
          ? filterTree(node.children, query)
          : [];
        if (matches || filteredChildren.length > 0) {
          acc.push({ ...node, children: filteredChildren });
        }
        return acc;
      }, []);
    },
    [],
  );

  const handleAddChildRef = useRef(handleAddChild);
  handleAddChildRef.current = handleAddChild;
  const handleEditRef = useRef(handleEdit);
  handleEditRef.current = handleEdit;
  const handleDeleteRef = useRef(handleDelete);
  handleDeleteRef.current = handleDelete;

  // Atualiza nós e layout ao receber novos dados ou alterar o filtro
  useEffect(() => {
    if (!organizationsTree || organizationsTree.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const filtered = filterTree(organizationsTree, searchTerm);
    const { nodes: initialNodes, edges: initialEdges } =
      convertTreeToFlow(filtered);

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges,
    );

    const nodesWithCallbacks = layoutedNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onAddChild: (org: any) => handleAddChildRef.current(org),
        onEdit: (org: any) => handleEditRef.current(org),
        onDelete: (id: string) => handleDeleteRef.current(id),
      },
    }));

    const handleUnlink = (childId: string) => {
      changeParent({
        id: childId,
        parentId: null,
      });
    };

    const edgesWithCallbacks = layoutedEdges.map((edge) => ({
      ...edge,
      data: {
        ...edge.data,
        onUnlink: handleUnlink,
      },
    }));

    setNodes(nodesWithCallbacks);
    setEdges(edgesWithCallbacks);
  }, [organizationsTree, searchTerm, filterTree, changeParent]);

  // Ao reconectar o final da aresta em outro nó pai
  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      edgeReconnectSuccessful.current = true;
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));

      if (newConnection.target && newConnection.source) {
        // source = novo pai, target = filho movido
        changeParent({
          id: newConnection.target,
          parentId: newConnection.source,
        });
      }
    },
    [changeParent, setEdges],
  );

  const onReconnectEnd = useCallback(
    (_: MouseEvent | TouchEvent, edge: Edge) => {
      // Se soltar a linha no vazio, remove o vínculo de pai (torna unidade raiz)
      if (!edgeReconnectSuccessful.current) {
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
        changeParent({
          id: edge.target,
          parentId: null,
        });
      }
      edgeReconnectSuccessful.current = true;
    },
    [changeParent, setEdges],
  );

  // Ao puxar uma nova linha de um pai (source) para um filho (target)
  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target && params.source !== params.target) {
        changeParent({
          id: params.target,
          parentId: params.source,
        });
      }
    },
    [changeParent],
  );

  if (isLoadingOrganizations) {
    return (
      <div className="flex h-96 items-center justify-center">
        Carregando organograma...
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b bg-card p-2">
        <div className="relative w-full">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar organização..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-sm"
          />
        </div>
        <Button size="sm" className="gap-2" onClick={() => handleAddChild()}>
          <Plus className="size-4" /> Nova Unidade
        </Button>
      </div>

      <div className="flex-1 bg-muted/20 h-[calc(100vh-120px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onReconnectStart={onReconnectStart}
          onReconnect={onReconnect}
          onReconnectEnd={onReconnectEnd}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          panOnDrag={[0, 1, 2]} // Permite arrastar com botão esquerdo ou toque com 1 dedo
          panOnScroll={false}
          zoomOnPinch={true} // Pinça com 2 dedos faz zoom normalmente
        >
          <Background color="#ccc" gap={16} />
          <Controls position="top-left" orientation="horizontal" />
        </ReactFlow>
      </div>
      <OrganizationModal
        isOpen={open}
        modalMode={modalMode}
        parent={parentOrg}
        onClose={handleCloseModal}
        onSubmit={handleSubmitModal}
        initialData={currentOrg}
      />
    </div>
  );
}
