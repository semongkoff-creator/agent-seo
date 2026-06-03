"use client";

import { useEffect, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { CreateProjectForm } from './CreateProjectForm';

export function CreateProjectModal() {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary transition-transform hover:-translate-y-0.5"
      >
        <Plus className="h-4 w-4" />
        New Project
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="w-[min(96vw,960px)] rounded-[32px] border border-outline-variant bg-surface-container-lowest p-0 shadow-2xl backdrop:bg-black/50"
      >
        <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4 md:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Quick Create</p>
            <h2 className="mt-1 text-lg font-semibold text-on-surface">Create project in a modal</h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-low"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto p-4 md:p-6">
          <CreateProjectForm />
        </div>
      </dialog>
    </>
  );
}
