import type { OutlineNode } from "./outline";

interface BreadcrumbsProps {
  path: OutlineNode | null;
  className?: string;
}

export function Breadcrumbs({ path, className = "" }: BreadcrumbsProps) {
  if (!path || path.path.length === 0) {
    return (
      <div className={`breadcrumbs ${className}`}>
        <span className="breadcrumbs-item">—</span>
      </div>
    );
  }

  return (
    <div className={`breadcrumbs ${className}`}>
      {path.path.map((segment, i) => (
        <span key={i} className="breadcrumbs-segment">
          {i > 0 && <span className="breadcrumbs-sep"> › </span>}
          <span className="breadcrumbs-item">{segment}</span>
        </span>
      ))}
    </div>
  );
}
