import React, { useState } from 'react';
import { Resource } from '@/types/crisis';

type ResourceInputProps = {
  resources: Resource[];
  setResources: (resources: Resource[]) => void;
  disabled?: boolean;
};

export default function ResourceInput({ resources, setResources, disabled = false }: ResourceInputProps) {
  const [newResourceName, setNewResourceName] = useState("");

  const handleValueChange = (id: string, value: string) => {
    const val = parseInt(value, 10);
    setResources(resources.map(r => r.id === id ? { ...r, value: isNaN(val) ? 0 : val } : r));
  };

  const handleRemove = (id: string) => {
    setResources(resources.filter(r => r.id !== id));
  };

  const handleAdd = () => {
    if (!newResourceName.trim()) return;
    setResources([...resources, { id: Date.now().toString(), name: newResourceName.trim(), value: 0 }]);
    setNewResourceName("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <section className="col-span-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col max-h-[850px]">
      <h2 className="text-xl font-semibold tracking-tight text-gray-900 mb-6">Available Resources</h2>
      
      <div className="flex-1 space-y-4 overflow-y-auto pr-2 min-h-[150px]">
        {resources.map((resource) => (
          <div key={resource.id} className="flex items-center justify-between gap-4 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
            <span className="text-sm font-medium text-gray-700 truncate">{resource.name}</span>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                min="0"
                disabled={disabled}
                className="w-24 h-10 px-3 text-sm border-gray-200 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 border text-right font-medium text-gray-900"
                value={resource.value === 0 && resource.value.toString() !== "0" ? "" : resource.value}
                onChange={(e) => handleValueChange(resource.id, e.target.value)}
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => handleRemove(resource.id)}
                className="text-gray-400 hover:text-red-500 transition-colors p-1.5 outline-none focus:ring-2 focus:ring-red-500 rounded-md"
                title="Remove resource"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {resources.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-4">No resources added.</div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3 items-stretch shrink-0 h-10">
        <input
          type="text"
          disabled={disabled}
          placeholder="New resource (e.g. Blankets)"
          value={newResourceName}
          onChange={(e) => setNewResourceName(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1 px-3 text-sm border-gray-200 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 border outline-none"
        />
        <button
          type="button"
          disabled={disabled || !newResourceName.trim()}
          onClick={handleAdd}
          className="px-4 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap border border-transparent"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Resource
        </button>
      </div>
    </section>
  );
}
