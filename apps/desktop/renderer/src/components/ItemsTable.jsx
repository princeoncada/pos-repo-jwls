import React from 'react';

export default function ItemsTable({ items }) {
  return (
    <table className="w-full text-left border">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 border">Title</th>
          <th className="p-2 border">Category</th>
          <th className="p-2 border">Karat</th>
          <th className="p-2 border">Weight (g)</th>
          <th className="p-2 border">State</th>
        </tr>
      </thead>
      <tbody>
        {items.map((it) => (
          <tr key={it.id}>
            <td className="p-2 border">{it.title}</td>
            <td className="p-2 border">{it.category}</td>
            <td className="p-2 border">{it.karat}</td>
            <td className="p-2 border">{it.weight_g}</td>
            <td className="p-2 border">{it.currentState}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
