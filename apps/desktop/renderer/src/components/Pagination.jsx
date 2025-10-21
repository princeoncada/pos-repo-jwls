import React from 'react';

export default function Pagination({ page, totalPages, onPrev, onNext, onGo }) {
  const pages = React.useMemo(() => {
    const arr = [];
    const start = Math.max(1, page - 3);
    const end = Math.min(totalPages, start + 6);
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }, [page, totalPages]);

  const goSafe = (p) => onGo(Math.min(Math.max(1, p), Math.max(1, totalPages)));

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        className="px-3 py-1 rounded border disabled:opacity-50"
        onClick={onPrev}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        ←
      </button>

      {pages.map((p) => (
        <button
          key={p}
          className={`px-3 py-1 rounded border ${p === page ? 'bg-black text-white' : ''}`}
          onClick={() => goSafe(p)}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      ))}

      <button
        className="px-3 py-1 rounded border disabled:opacity-50"
        onClick={onNext}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        →
      </button>
    </div>
  );
}
