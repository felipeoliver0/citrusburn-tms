'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import { updateLoadStatusAction } from '@/app/(protected)/board/actions';
import { LoadStatus } from '@prisma/client';

type Load = {
  id: string;
  originCity: string;
  destCity: string;
  price: number;
  status: LoadStatus;
};

type KanbanBoardProps = {
  initialLoads: Load[];
};

const COLUMNS: { id: LoadStatus; title: string; color: string }[] = [
  { id: 'AVAILABLE', title: 'Available', color: 'bg-gray-100' },
  { id: 'BOOKED', title: 'Booked', color: 'bg-brand-50' },
  { id: 'IN_TRANSIT', title: 'In Transit', color: 'bg-amber-50' },
  { id: 'DELIVERED', title: 'Delivered', color: 'bg-emerald-50' },
];

function SortableItem({ load }: { load: Load }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: load.id, data: load });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-3 cursor-grab active:cursor-grabbing hover:border-brand-300 transition-colors"
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-gray-400">#{load.id.slice(-6).toUpperCase()}</span>
        <span className="text-sm font-black text-emerald-600">${load.price}</span>
      </div>
      <div className="font-bold text-gray-800 text-sm">
        {load.originCity} &rarr; {load.destCity}
      </div>
    </div>
  );
}

function Column({
  id,
  title,
  color,
  loads,
}: {
  id: string;
  title: string;
  color: string;
  loads: Load[];
}) {
  return (
    <div className={`flex-1 min-w-[280px] rounded-2xl p-4 ${color} border border-gray-200 flex flex-col h-[calc(100vh-200px)]`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800">{title}</h3>
        <span className="bg-white text-xs font-bold px-2 py-1 rounded-full shadow-sm text-gray-600">{loads.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 pb-10">
        <SortableContext id={id} items={loads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {loads.map(load => (
            <SortableItem key={load.id} load={load} />
          ))}
          {loads.length === 0 && (
            <div className="text-center p-8 text-sm text-gray-400 font-medium border-2 border-dashed border-gray-300 rounded-xl">
              Drop here
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

export default function KanbanBoard({ initialLoads }: KanbanBoardProps) {
  const [loads, setLoads] = useState<Load[]>(initialLoads);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Se soltar na mesma coluna ou mesmo item, não faz nada
    if (activeId === overId) return;

    // Identificar de onde veio e para onde vai
    const activeLoad = loads.find(l => l.id === activeId);
    if (!activeLoad) return;

    // Verificar se o container de destino é uma das colunas (soltou no vazio da coluna)
    const isOverColumn = COLUMNS.some(c => c.id === overId);
    let targetStatus: LoadStatus = activeLoad.status;

    if (isOverColumn) {
      targetStatus = overId as LoadStatus;
    } else {
      // Soltou em cima de outro item
      const overLoad = loads.find(l => l.id === overId);
      if (overLoad) {
        targetStatus = overLoad.status;
      }
    }

    if (activeLoad.status === targetStatus) return;

    // Optimistic UI Update
    setLoads(prev => 
      prev.map(l => l.id === activeId ? { ...l, status: targetStatus } : l)
    );

    try {
      await updateLoadStatusAction(activeId, targetStatus);
      toast.success(`Load moved to ${targetStatus}`);
    } catch (error) {
      toast.error('Failed to update load status');
      // Revert on failure
      setLoads(initialLoads);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
        {COLUMNS.map(column => {
          const columnLoads = loads.filter(l => l.status === column.id);
          return (
            <Column
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              loads={columnLoads}
            />
          );
        })}
      </div>
    </DndContext>
  );
}
