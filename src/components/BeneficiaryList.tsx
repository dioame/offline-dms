"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteBeneficiary,
  getBeneficiaries,
  type Beneficiary,
} from "@/lib/db";

export default function BeneficiaryList() {
  const [records, setRecords] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBeneficiaries();
      setRecords(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  async function handleDelete(id: number) {
    await deleteBeneficiary(id);
    await loadRecords();
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading records...</p>;
  }

  if (records.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
        No beneficiaries yet. Add the first record above.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
      {records.map((record) => (
        <li
          key={record.id}
          className="flex items-start justify-between gap-4 px-4 py-3"
        >
          <div>
            <p className="font-medium text-zinc-900">{record.firstName}</p>
            <p className="mt-1 text-sm text-zinc-600">{record.address}</p>
            <p className="mt-1 text-xs text-zinc-400">
              {record.createdAt.toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            onClick={() => record.id && void handleDelete(record.id)}
            className="shrink-0 text-sm text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
