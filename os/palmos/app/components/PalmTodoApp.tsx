'use client';

import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { usePalmSounds } from '../hooks/usePalmSounds';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  priority: number;
}

export function PalmTodoApp() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { playClick, playSuccess, playError } = usePalmSounds();

  useEffect(() => {
    const saved = localStorage.getItem('palmos-todos');
    if (saved) {
      try {
        setTodos(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load todos', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('palmos-todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (!inputValue.trim()) {
      playError();
      return;
    }
    playSuccess();
    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text: inputValue,
      completed: false,
      priority: 1,
    };
    setTodos([...todos, newTodo]);
    setInputValue('');
    setIsAdding(false);
  };

  const toggleTodo = (id: string) => {
    playClick();
    setTodos(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTodo = (id: string) => {
    playClick();
    setTodos(todos.filter((t) => t.id !== id));
  };

  return (
    <div className="flex h-full w-full flex-col p-2 text-[#2a2d24]">
      <div className="flex-1 overflow-y-auto">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className="group flex items-start gap-2 border-b border-[#2a2d24]/10 py-1"
          >
            <button
              onClick={() => toggleTodo(todo.id)}
              className={`mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm border border-[#2a2d24]`}
            >
              {todo.completed && <div className="h-2 w-2 bg-[#2a2d24]"></div>}
            </button>
            <span className="mr-1 text-xs font-bold">{todo.priority}</span>
            <span className={`flex-1 text-sm ${todo.completed ? 'opacity-50 line-through' : ''}`}>
              {todo.text}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="p-1 opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}

        {isAdding ? (
          <div className="mt-2 flex flex-col gap-2 border border-[#2a2d24] bg-[#7a826b]/20 p-2">
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTodo()}
              className="w-full border-b border-[#2a2d24] bg-transparent text-sm outline-none"
              placeholder="New task..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAdding(false)}
                className="border border-[#2a2d24] px-2 py-0.5 text-xs active:bg-[#2a2d24] active:text-[#8c927b]"
              >
                Cancel
              </button>
              <button
                onClick={addTodo}
                className="border border-[#2a2d24] px-2 py-0.5 text-xs active:bg-[#2a2d24] active:text-[#8c927b]"
              >
                Details
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex gap-2 border-t border-[#2a2d24] pt-2">
        <button
          onClick={() => setIsAdding(true)}
          className="border-2 border-[#2a2d24] px-3 py-0.5 text-sm font-bold active:bg-[#2a2d24] active:text-[#8c927b]"
        >
          New
        </button>
        <button className="border-2 border-[#2a2d24] px-3 py-0.5 text-sm font-bold active:bg-[#2a2d24] active:text-[#8c927b]">
          Details
        </button>
        <button className="border-2 border-[#2a2d24] px-3 py-0.5 text-sm font-bold active:bg-[#2a2d24] active:text-[#8c927b]">
          Show...
        </button>
      </div>
    </div>
  );
}
