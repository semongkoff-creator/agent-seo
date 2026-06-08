"use client";

import { useEffect, useMemo, useState } from 'react';
import type { TechnicalErrorRecord, TechnicalErrorStatus } from '@/types/wizard';

const STORAGE_PREFIX = 'seo-agent:technical-errors';

function storageKey(projectId: string) {
  return `${STORAGE_PREFIX}:${projectId}`;
}

function readStoredErrors(projectId: string, fallback: TechnicalErrorRecord[]) {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const raw = window.localStorage.getItem(storageKey(projectId));
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as TechnicalErrorRecord[];
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function persistErrors(projectId: string, errors: TechnicalErrorRecord[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(storageKey(projectId), JSON.stringify(errors));
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function useTechnicalErrors(projectId: string, initialErrors: TechnicalErrorRecord[]) {
  const [errors, setErrors] = useState<TechnicalErrorRecord[]>(() => initialErrors);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setErrors(readStoredErrors(projectId, initialErrors));
  }, [initialErrors, projectId]);

  useEffect(() => {
    persistErrors(projectId, errors);
  }, [errors, projectId]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== storageKey(projectId) || !event.newValue) {
        return;
      }

      try {
        const parsed = JSON.parse(event.newValue) as TechnicalErrorRecord[];
        if (Array.isArray(parsed)) {
          setErrors(parsed);
        }
      } catch {
        // Ignore malformed cross-tab payloads.
      }
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [projectId]);

  async function updateStatus(errorId: string, status: TechnicalErrorStatus) {
    setLoading(true);

    try {
      const applyLocalUpdate = () => {
        setErrors((current) => {
          const next = current.map((item) => (item.id === errorId ? { ...item, status } : item));
          persistErrors(projectId, next);
          return next;
        });
      };

      if (!isUuid(errorId)) {
        applyLocalUpdate();
        return;
      }

      try {
        const response = await fetch(`/api/projects/${projectId}/technical-errors/${errorId}`, {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({ status })
        });

        const body = await response.json();
        if (!response.ok) {
          applyLocalUpdate();
          return;
        }

        const updated = body?.data as TechnicalErrorRecord | undefined;
        if (updated) {
          setErrors((current) => {
            const next = current.map((item) => (item.id === updated.id ? updated : item));
            persistErrors(projectId, next);
            return next;
          });
          return;
        }
      } catch {
        applyLocalUpdate();
        return;
      }
    } finally {
      setLoading(false);
    }
  }

  const fixedCount = useMemo(() => errors.filter((item) => item.status === 'fixed').length, [errors]);

  return {
    errors,
    fixedCount,
    loading,
    updateStatus
  };
}
