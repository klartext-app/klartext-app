import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import type { OutlineNode } from "./outline";

interface DocumentOutlineProps {
  root: OutlineNode | null;
  onSelectLine: (line: number) => void;
  className?: string;
}

export function DocumentOutline({ root, onSelectLine, className = "" }: DocumentOutlineProps) {
  if (!root) {
    return (
      <div className={`document-outline ${className}`}>
        <div className="document-outline-empty">Keine Struktur (nur JSON/XML).</div>
      </div>
    );
  }

  return (
    <div className={`document-outline ${className}`}>
      <div className="document-outline-header">Struktur</div>
      <ul className="document-outline-tree">
        <OutlineTreeNode node={root} onSelectLine={onSelectLine} depth={0} />
      </ul>
    </div>
  );
}

function OutlineTreeNode({
  node,
  onSelectLine,
  depth,
}: {
  node: OutlineNode;
  onSelectLine: (line: number) => void;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <li className="document-outline-item" data-depth={depth}>
      <div
        className="document-outline-row"
        style={{ paddingLeft: depth * 12 + 8 }}
        onClick={() => onSelectLine(node.line)}
      >
        <span
          className="document-outline-toggle"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setExpanded((e) => !e);
          }}
          aria-hidden
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )
          ) : (
            <span className="document-outline-dot" />
          )}
        </span>
        <span className="document-outline-label" title={`Zeile ${node.line}`}>
          {node.label}
        </span>
      </div>
      {hasChildren && expanded && (
        <ul className="document-outline-tree">
          {node.children.map((child) => (
            <OutlineTreeNode key={child.id} node={child} onSelectLine={onSelectLine} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
