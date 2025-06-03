import { useState } from 'react';
import { X } from 'lucide-react';

interface ItemFields {
  [key: string]: string | undefined;
}

interface ItemListManagerProps<T extends ItemFields> {
  title: string;
  items: T[];
  fields: {
    name: string; 
    label: string;
    placeholder: string;
    type?: string;
    required?: boolean;
  }[];
  onAddItem: (item: T) => void;
  onRemoveItem: (index: number) => void;
  itemComponent?: (item: T, index: number, onRemove: () => void) => React.ReactNode;
  emptyMessage?: string;
}

export function ItemListManager<T extends ItemFields>({
  title,
  items,
  fields,
  onAddItem,
  onRemoveItem,
  itemComponent,
  emptyMessage = "No items added yet."
}: ItemListManagerProps<T>) {
  const [newItem, setNewItem] = useState<ItemFields>({});
  const [isAdding, setIsAdding] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<ItemFields>({});

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const allRequiredFilled = fields
      .filter(field => field.required)
      .every(field => newItem[field.name]?.trim());
    if (allRequiredFilled) {
      onAddItem(newItem as T);
      setNewItem({});
      setIsAdding(false);
    }
  };

  const handleEditSubmit = (index: number) => {
    const allRequiredFilled = fields
      .filter(field => field.required)
      .every(field => editItem[field.name]?.trim());
    if (allRequiredFilled) {
      // Replace the item at index
      const updated = [...items];
      updated[index] = { ...updated[index], ...editItem };
      // Simulate update by removing and re-adding (since no onEditItem prop)
      onRemoveItem(index);
      onAddItem(updated[index]);
      setEditIndex(null);
      setEditItem({});
    }
  };

  const handleFieldChange = (name: string, value: string) => {
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  const handleEditFieldChange = (name: string, value: string) => {
    setEditItem(prev => ({ ...prev, [name]: value }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const inputClassName = "w-full px-3 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input)] text-[var(--input-foreground)] text-sm";

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">{title}</h3>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="text-sm font-medium text-[var(--primary)] hover:underline"
          >
            + Add New
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mb-4 p-4 border rounded-md bg-[var(--card)] shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.name} className="flex flex-col">
                <label htmlFor={field.name} className="text-sm font-medium mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    id={field.name}
                    placeholder={field.placeholder}
                    value={newItem[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    required={field.required}
                    rows={3}
                    className={inputClassName}
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    id={field.name}
                    placeholder={field.placeholder}
                    value={newItem[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    onKeyDown={handleKeyDown}
                    required={field.required}
                    className={inputClassName}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4 space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewItem({});
              }}
              className="px-3 py-1 text-sm rounded-md border border-[var(--border)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="px-3 py-1 text-sm rounded-md bg-[var(--primary)] text-[var(--primary-foreground)]"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)] italic">{emptyMessage}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            itemComponent ? (
              itemComponent(item, index, () => onRemoveItem(index))
            ) : (
              <div key={index} className="flex justify-between items-center p-3 rounded-md border border-[var(--border)] bg-[var(--card)]">
                {editIndex === index ? (
                  <div className="w-full">
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fields.map((field) => (
                          <div key={field.name} className="flex flex-col">
                            <label htmlFor={`edit-${field.name}`} className="text-sm font-medium mb-1">
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            {field.type === 'textarea' ? (
                              <textarea
                                id={`edit-${field.name}`}
                                placeholder={field.placeholder}
                                value={editItem[field.name] || ''}
                                onChange={(e) => handleEditFieldChange(field.name, e.target.value)}
                                required={field.required}
                                rows={3}
                                className={inputClassName}
                              />
                            ) : (
                              <input
                                type={field.type || 'text'}
                                id={`edit-${field.name}`}
                                placeholder={field.placeholder}
                                value={editItem[field.name] || ''}
                                onChange={(e) => handleEditFieldChange(field.name, e.target.value)}
                                required={field.required}
                                className={inputClassName}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end mt-4 space-x-2">
                        <button
                          type="button"
                          onClick={() => { setEditIndex(null); setEditItem({}); }}
                          className="px-3 py-1 text-sm rounded-md border border-[var(--border)]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditSubmit(index)}
                          className="px-3 py-1 text-sm rounded-md bg-[var(--primary)] text-[var(--primary-foreground)]"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      {fields.map(field => (
                        item[field.name] !== undefined && item[field.name] !== '' ? (
                          <span key={field.name} className="mr-3">
                            <span className="text-[var(--muted-foreground)] text-xs mr-1">{field.label || field.name}:</span>
                            <span className="text-sm">{item[field.name]}</span>
                          </span>
                        ) : null
                      ))}
                      {item.details && (
                        <p className="text-xs text-[var(--muted-foreground)] mt-1">{item.details}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => { setEditIndex(index); setEditItem(item); }}
                        className="text-[var(--muted-foreground)] hover:text-blue-500 text-xs border px-2 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(index)}
                        className="text-[var(--muted-foreground)] hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
} 