import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormField, FormSection } from '@/lib/validation';
import Button from './Button';

// ─── Types & Constants ──────────────────────────────────────────────────────

interface FormBuilderProps {
  initialFields?: FormField[];
  initialSections?: FormSection[];
  onSave: (fields: FormField[], sections: FormSection[]) => void;
  isLoading?: boolean;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Short answer', icon: '─' },
  { value: 'textarea', label: 'Paragraph', icon: '≡' },
  { value: 'email', label: 'Email', icon: '@' },
  { value: 'select', label: 'Dropdown', icon: '▾' },
  { value: 'radio', label: 'Multiple choice', icon: '◉' },
  { value: 'checkbox', label: 'Checkboxes', icon: '☑' },
  { value: 'date', label: 'Date', icon: '📅' },
] as const;

function generateId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateSectionId(): string {
  return `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createEmptyField(order: number, sectionId: string): FormField {
  return {
    id: generateId(),
    type: 'text',
    label: '',
    placeholder: '',
    required: false,
    options: [],
    order,
    sectionId,
  };
}

function createSection(order: number, title: string = 'Untitled Section'): FormSection {
  return {
    id: generateSectionId(),
    title,
    description: '',
    order,
  };
}

// ─── Sortable Field Item ────────────────────────────────────────────────────

interface SortableFieldItemProps {
  field: FormField;
  isActive: boolean;
  onFocus: () => void;
  onUpdate: (updates: Partial<FormField>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function SortableFieldItem({
  field,
  isActive,
  onFocus,
  onUpdate,
  onDelete,
  onDuplicate,
}: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : ('auto' as any),
  };

  return (
    <div ref={setNodeRef} style={style}>
      <FieldCard
        field={field}
        isActive={isActive}
        onFocus={onFocus}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

// ─── Main FormBuilder ───────────────────────────────────────────────────────

export default function FormBuilder({
  initialFields = [],
  initialSections = [],
  onSave,
  isLoading = false,
}: FormBuilderProps) {
  const [fields, setFields] = useState<FormField[]>([]);
  const [sections, setSections] = useState<FormSection[]>([]);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ── Initialise ──────────────────────────────────────────────────────────
  useEffect(() => {
    let secs =
      initialSections && initialSections.length > 0
        ? initialSections.map((s, i) => ({ ...s, order: s.order ?? i }))
        : [createSection(0, 'Section 1')];

    setSections(secs);

    if (initialFields && initialFields.length > 0) {
      const defaultSectionId = secs[0].id;
      setFields(
        initialFields.map((f, i) => ({
          ...f,
          order: f.order ?? i,
          sectionId: f.sectionId || defaultSectionId,
        }))
      );
    } else {
      const firstField = createEmptyField(0, secs[0].id);
      setFields([firstField]);
      setActiveFieldId(firstField.id);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ─────────────────────────────────────────────────────────────
  const getFieldsForSection = useCallback(
    (sectionId: string) =>
      fields
        .filter((f) => f.sectionId === sectionId)
        .sort((a, b) => a.order - b.order),
    [fields]
  );

  // ── Field CRUD ──────────────────────────────────────────────────────────
  const addField = (sectionId: string) => {
    const sectionFields = getFieldsForSection(sectionId);
    const newField = createEmptyField(sectionFields.length, sectionId);
    setFields([...fields, newField]);
    setActiveFieldId(newField.id);
  };

  const duplicateField = (fieldId: string) => {
    const original = fields.find((f) => f.id === fieldId);
    if (!original) return;
    const sectionFields = getFieldsForSection(original.sectionId!);
    const newField: FormField = {
      ...original,
      id: generateId(),
      label: `${original.label} (copy)`,
      order: sectionFields.length,
    };
    setFields([...fields, newField]);
    setActiveFieldId(newField.id);
  };

  const deleteField = (fieldId: string) => {
    if (fields.length === 1) {
      alert('Form must have at least one field');
      return;
    }
    setFields(fields.filter((f) => f.id !== fieldId));
    if (activeFieldId === fieldId) setActiveFieldId(null);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)));
  };

  // ── Section CRUD ────────────────────────────────────────────────────────
  const addSection = () => {
    const newSection = createSection(sections.length, `Section ${sections.length + 1}`);
    setSections([...sections, newSection]);
  };

  const updateSection = (sectionId: string, updates: Partial<FormSection>) => {
    setSections(sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)));
  };

  const deleteSection = (sectionId: string) => {
    if (sections.length === 1) {
      alert('Form must have at least one section');
      return;
    }
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === sectionId);
    const targetSection = sorted[idx === 0 ? 1 : idx - 1];
    setFields(
      fields.map((f) =>
        f.sectionId === sectionId ? { ...f, sectionId: targetSection.id } : f
      )
    );
    setSections(
      sections
        .filter((s) => s.id !== sectionId)
        .map((s, i) => ({ ...s, order: i }))
    );
  };

  // ── Drag handlers ───────────────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeField = fields.find((f) => f.id === active.id);
    const overField = fields.find((f) => f.id === over.id);

    if (activeField && overField) {
      if (activeField.sectionId === overField.sectionId) {
        // Same section reorder
        const sectionId = activeField.sectionId!;
        const sectionFields = getFieldsForSection(sectionId);
        const oldIndex = sectionFields.findIndex((f) => f.id === active.id);
        const newIndex = sectionFields.findIndex((f) => f.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(sectionFields, oldIndex, newIndex).map(
            (f, i) => ({ ...f, order: i })
          );
          setFields((prev) => [
            ...prev.filter((f) => f.sectionId !== sectionId),
            ...reordered,
          ]);
        }
      } else {
        // Cross-section move
        const fromSectionId = activeField.sectionId!;
        const toSectionId = overField.sectionId!;
        const toFields = getFieldsForSection(toSectionId);
        const overIndex = toFields.findIndex((f) => f.id === over.id);

        setFields((prev) => {
          const withoutDragged = prev.filter((f) => f.id !== active.id);
          const updatedDragged = { ...activeField, sectionId: toSectionId };

          const targetSectionFields = withoutDragged
            .filter((f) => f.sectionId === toSectionId)
            .sort((a, b) => a.order - b.order);

          const insertAt = Math.max(0, overIndex);
          targetSectionFields.splice(insertAt, 0, updatedDragged);

          const reindexedTarget = targetSectionFields.map((f, i) => ({
            ...f,
            order: i,
          }));
          const reindexedSource = withoutDragged
            .filter((f) => f.sectionId === fromSectionId)
            .sort((a, b) => a.order - b.order)
            .map((f, i) => ({ ...f, order: i }));

          const others = withoutDragged.filter(
            (f) =>
              f.sectionId !== toSectionId && f.sectionId !== fromSectionId
          );

          return [...others, ...reindexedSource, ...reindexedTarget];
        });
      }
    }
  };

  // ── Save ────────────────────────────────────────────────────────────────
  const handleSave = () => {
    const emptyLabels = fields.filter((f) => !f.label.trim());
    if (emptyLabels.length > 0) {
      alert('All fields must have a question/label');
      return;
    }

    const missingOptions = fields.filter(
      (f) =>
        (f.type === 'select' || f.type === 'radio') &&
        (!f.options || f.options.length === 0)
    );
    if (missingOptions.length > 0) {
      alert('Dropdown and Multiple Choice fields must have at least one option');
      return;
    }

    const finalFields = fields.map((f, i) => ({ ...f, order: i }));
    const finalSections = sections.map((s, i) => ({ ...s, order: i }));
    onSave(finalFields, finalSections);
  };

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  const draggedField = activeDragId
    ? fields.find((f) => f.id === activeDragId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Sections */}
        {sortedSections.map((section, sectionIndex) => {
          const sectionFields = getFieldsForSection(section.id);
          const sectionFieldIds = sectionFields.map((f) => f.id);

          return (
            <div
              key={section.id}
              className="opacity-0 animate-fadeInUp"
              style={{
                animationDelay: `${sectionIndex * 80}ms`,
                animationFillMode: 'forwards',
              }}
            >
              {/* Section Header Card */}
              <div className="mb-3 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="h-[10px] w-full bg-blue-600 rounded-t-lg" />
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) =>
                          updateSection(section.id, { title: e.target.value })
                        }
                        placeholder="Untitled Section"
                        className="w-full border-none bg-transparent text-2xl font-normal text-gray-900 placeholder-gray-400 focus:outline-none focus:border-b-2 focus:border-blue-600"
                        style={{
                          fontFamily:
                            "'Google Sans', 'Segoe UI', Roboto, sans-serif",
                        }}
                      />
                      <input
                        type="text"
                        value={section.description || ''}
                        onChange={(e) =>
                          updateSection(section.id, {
                            description: e.target.value,
                          })
                        }
                        placeholder="Form description"
                        className="mt-2 w-full border-none bg-transparent text-sm text-gray-600 placeholder-gray-400 focus:outline-none"
                      />
                    </div>

                    {sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteSection(section.id)}
                        className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        title="Delete section"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Fields in this section */}
              <SortableContext
                items={sectionFieldIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {sectionFields.map((field) => (
                    <SortableFieldItem
                      key={field.id}
                      field={field}
                      isActive={activeFieldId === field.id}
                      onFocus={() => setActiveFieldId(field.id)}
                      onUpdate={(updates) => updateField(field.id, updates)}
                      onDelete={() => deleteField(field.id)}
                      onDuplicate={() => duplicateField(field.id)}
                    />
                  ))}
                </div>
              </SortableContext>

              {/* Add question button */}
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={() => addField(section.id)}
                  className="group flex items-center gap-2 rounded-full border border-dashed border-gray-300 bg-white px-5 py-2.5 text-sm text-gray-500 shadow-sm transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
                >
                  <svg
                    className="h-5 w-5 transition-colors group-hover:text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add question
                </button>
              </div>
            </div>
          );
        })}

        {/* Add Section Button */}
        <div className="flex justify-center py-2">
          <button
            type="button"
            onClick={addSection}
            className="group flex items-center gap-2 rounded-full border border-blue-300 bg-white px-5 py-2.5 text-sm font-medium text-blue-600 shadow-sm transition-all hover:bg-blue-50 hover:border-blue-400 hover:shadow-md"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add section
          </button>
        </div>

        {/* Save Button */}
        <div className="flex justify-end border-t border-gray-200 pt-6">
          <Button onClick={handleSave} isLoading={isLoading}>
            Save Form
          </Button>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedField ? (
          <div className="rounded-lg border-2 border-blue-400 bg-white p-4 shadow-2xl opacity-90">
            <p className="text-sm font-medium text-gray-700">
              {draggedField.label || 'Untitled question'}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {FIELD_TYPES.find((t) => t.value === draggedField.type)?.label}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// ─── Field Card Component ─────────────────────────────────────────────────────

interface FieldCardProps {
  field: FormField;
  isActive: boolean;
  onFocus: () => void;
  onUpdate: (updates: Partial<FormField>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  dragHandleProps?: Record<string, any>;
}

function FieldCard({
  field,
  isActive,
  onFocus,
  onUpdate,
  onDelete,
  onDuplicate,
  dragHandleProps = {},
}: FieldCardProps) {
  const [optionInput, setOptionInput] = useState('');

  const addOption = () => {
    if (!optionInput.trim()) return;
    const newOptions = [...(field.options || []), optionInput.trim()];
    onUpdate({ options: newOptions });
    setOptionInput('');
  };

  const removeOption = (index: number) => {
    const newOptions = field.options?.filter((_, i) => i !== index) || [];
    onUpdate({ options: newOptions });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(field.options || [])];
    newOptions[index] = value;
    onUpdate({ options: newOptions });
  };

  const needsOptions = field.type === 'select' || field.type === 'radio';

  return (
    <div
      onClick={onFocus}
      className={`
        relative overflow-hidden rounded-lg border bg-white transition-all duration-200 cursor-pointer
        ${
          isActive
            ? 'border-transparent shadow-md ring-2 ring-blue-500'
            : 'border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md'
        }
      `}
    >
      {/* Left accent bar (Google Forms style) */}
      <div
        className={`
          absolute left-0 top-0 h-full w-[6px] transition-all duration-200
          ${isActive ? 'bg-blue-600' : 'bg-transparent'}
        `}
      />

      <div className="p-5 pl-7">
        {/* Drag Handle */}
        <div className="flex justify-center -mt-2 mb-2">
          <div
            {...dragHandleProps}
            className="cursor-grab rounded px-3 py-0.5 text-gray-300 hover:text-gray-500 active:cursor-grabbing transition-colors"
            title="Drag to reorder"
          >
            <svg className="h-4 w-5" viewBox="0 0 20 10" fill="currentColor">
              <circle cx="4" cy="2" r="1.5" />
              <circle cx="10" cy="2" r="1.5" />
              <circle cx="16" cy="2" r="1.5" />
              <circle cx="4" cy="8" r="1.5" />
              <circle cx="10" cy="8" r="1.5" />
              <circle cx="16" cy="8" r="1.5" />
            </svg>
          </div>
        </div>

        {/* Question + Type row */}
        <div className="mb-4 flex items-start gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Question"
              className={`
                w-full bg-transparent pb-2 text-base text-gray-900 placeholder-gray-400 transition-all
                border-b-2 focus:outline-none
                ${
                  isActive
                    ? 'border-blue-600 bg-gray-50 rounded-t px-2 py-3'
                    : 'border-transparent hover:border-gray-200'
                }
              `}
            />
          </div>

          {/* Field Type Dropdown */}
          {isActive && (
            <div className="relative flex-shrink-0">
              <select
                value={field.type}
                onChange={(e) =>
                  onUpdate({ type: e.target.value as FormField['type'] })
                }
                className="appearance-none rounded-md border border-gray-300 bg-white py-2.5 pl-3 pr-10 text-sm text-gray-700 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {FIELD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Field Content Preview */}
        <div className="mb-4">
          {field.type === 'textarea' ? (
            <div className="border-b border-gray-200 py-2">
              <input
                type="text"
                value={field.placeholder || ''}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                placeholder="Long answer text"
                className="w-full bg-transparent text-sm text-gray-400 placeholder-gray-400 focus:outline-none"
                disabled={!isActive}
              />
            </div>
          ) : field.type === 'checkbox' ? (
            <div className="flex items-center gap-3 py-2 text-gray-400">
              <div className="flex h-[18px] w-[18px] items-center justify-center rounded border-2 border-gray-300">
                <svg
                  className="h-3 w-3 text-transparent"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-sm text-gray-500">Checkbox</span>
            </div>
          ) : field.type === 'date' ? (
            <div className="flex items-center gap-2 border-b border-gray-200 py-2 text-gray-400">
              <span className="text-sm">Month, Day, Year</span>
              <svg
                className="ml-auto h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          ) : needsOptions ? (
            /* Options Editor for Select/Radio */
            <div className="space-y-2.5">
              {field.options?.map((option, index) => (
                <div key={index} className="group flex items-center gap-3">
                  {field.type === 'radio' ? (
                    <div className="h-[18px] w-[18px] rounded-full border-2 border-gray-300 flex-shrink-0" />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded text-xs font-medium text-gray-400 flex-shrink-0">
                      {index + 1}.
                    </span>
                  )}
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="flex-1 border-b border-transparent bg-transparent py-1.5 text-sm text-gray-700 transition-colors focus:border-gray-300 focus:outline-none"
                  />
                  {isActive && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeOption(index);
                      }}
                      className="rounded-full p-1 text-gray-400 opacity-0 transition-all hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}

              {/* Add Option Input */}
              {isActive && (
                <div className="flex items-center gap-3">
                  {field.type === 'radio' ? (
                    <div className="h-[18px] w-[18px] rounded-full border-2 border-dashed border-gray-300 flex-shrink-0" />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded text-xs font-medium text-gray-400 flex-shrink-0">
                      {(field.options?.length || 0) + 1}.
                    </span>
                  )}
                  <input
                    type="text"
                    value={optionInput}
                    onChange={(e) => setOptionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        addOption();
                      }
                    }}
                    placeholder="Add option"
                    className="flex-1 border-b border-transparent bg-transparent py-1.5 text-sm text-gray-500 placeholder-gray-400 transition-colors focus:border-gray-300 focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {optionInput && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addOption();
                      }}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Add
                    </button>
                  )}
                </div>
              )}

              {/* Quick Add */}
              {isActive && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newOptions = [
                      ...(field.options || []),
                      `Option ${(field.options?.length || 0) + 1}`,
                    ];
                    onUpdate({ options: newOptions });
                  }}
                  className="ml-9 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Add option
                </button>
              )}
            </div>
          ) : (
            /* Text/Email Input Preview */
            <div className="border-b border-gray-200 py-2">
              <input
                type="text"
                value={field.placeholder || ''}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                placeholder={
                  field.type === 'email'
                    ? 'email@example.com'
                    : 'Short answer text'
                }
                className="w-full bg-transparent text-sm text-gray-400 placeholder-gray-400 focus:outline-none"
                disabled={!isActive}
              />
            </div>
          )}
        </div>

        {/* Field Footer - Actions (only visible when active) */}
        {isActive && (
          <div className="flex items-center justify-end border-t border-gray-100 pt-4">
            <div className="flex items-center gap-1">
              {/* Duplicate */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                className="rounded-full p-2.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                title="Duplicate"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="rounded-full p-2.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-500"
                title="Delete"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>

              {/* Separator */}
              <div className="mx-2 h-7 w-px bg-gray-200" />

              {/* Required Toggle */}
              <label
                className="flex items-center gap-2.5 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-sm text-gray-600">Required</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate({ required: !field.required });
                  }}
                  className={`
                    relative h-6 w-11 rounded-full transition-colors duration-200
                    ${field.required ? 'bg-blue-600' : 'bg-gray-300'}
                  `}
                >
                  <span
                    className={`
                      absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200
                      ${field.required ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  />
                </button>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
