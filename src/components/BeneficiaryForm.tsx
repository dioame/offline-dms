"use client";

import { FormEvent, useState } from "react";
import { addBeneficiary } from "@/lib/db";

type BeneficiaryFormProps = {
  onSaved: () => void;
};

export default function BeneficiaryForm({ onSaved }: BeneficiaryFormProps) {
  const [firstName, setFirstName] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!firstName.trim() || !address.trim()) {
      setMessage("Please enter first name and address.");
      return;
    }

    setSaving(true);

    try {
      await addBeneficiary(firstName, address);
      setFirstName("");
      setAddress("");
      setMessage("Beneficiary saved locally.");
      onSaved();
    } catch {
      setMessage("Could not save record. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="firstName" className="mb-1 block text-sm font-medium">
          First name
        </label>
        <input
          id="firstName"
          type="text"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          placeholder="Juan"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-blue-500 focus:ring-2"
          autoComplete="given-name"
        />
      </div>

      <div>
        <label htmlFor="address" className="mb-1 block text-sm font-medium">
          Address
        </label>
        <textarea
          id="address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Barangay, Municipality, Province"
          rows={3}
          className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-blue-500 focus:ring-2"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-blue-700 px-4 py-2.5 font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save beneficiary"}
      </button>

      {message && (
        <p
          className={`text-sm ${message.includes("saved") ? "text-emerald-700" : "text-red-600"}`}
          role="status"
        >
          {message}
        </p>
      )}
    </form>
  );
}
