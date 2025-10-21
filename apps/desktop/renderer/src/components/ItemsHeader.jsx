import React from 'react';

export default function ItemsHeader({ title, onAddDemo }) {
  return (
    <header className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">{title}</h1>
      <button
        onClick={onAddDemo}
        className="px-3 py-2 rounded bg-black text-white"
      >
        Add demo item
      </button>
    </header>
  );
}
