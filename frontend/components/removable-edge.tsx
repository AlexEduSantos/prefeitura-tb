import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
} from "@xyflow/react";
import { Unlink } from "lucide-react";
import { useState } from "react";

export function RemovableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  target,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [isHovered, setIsHovered] = useState(false);
  const showButton = selected || isHovered;

  const onUnlink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data && typeof data.onUnlink === "function") {
      data.onUnlink(target, id);
    }
  };

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="cursor-pointer"
    >
      {/* Invisible wider stroke path for easier hover detection */}
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={24}
        className="react-flow__edge-interaction"
      />

      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: showButton ? "#ffa4a4" : style.stroke || "#e2e8f0",
          strokeWidth: showButton ? 1.5 : style.strokeWidth || 1,
          transition: "stroke 0.2s, stroke-width 0.2s",
        }}
      />

      {showButton && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan z-20"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <button
              type="button"
              onClick={onUnlink}
              title="Desfazer vínculo hierárquico"
              className="flex size-6 items-center justify-center rounded-full border border-destructive/30 bg-card text-destructive shadow-sm hover:scale-110 transition-all duration-150 cursor-pointer"
            >
              <Unlink className="size-3" />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </g>
  );
}
