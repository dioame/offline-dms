import Dexie, { type EntityTable } from "dexie";

export type Beneficiary = {
  id?: number;
  firstName: string;
  address: string;
  createdAt: Date;
};

const db = new Dexie("OfflineDMS") as Dexie & {
  beneficiaries: EntityTable<Beneficiary, "id">;
};

db.version(1).stores({
  beneficiaries: "++id, firstName, createdAt",
});

export { db };

export async function addBeneficiary(
  firstName: string,
  address: string,
): Promise<number> {
  const id = await db.beneficiaries.add({
    firstName: firstName.trim(),
    address: address.trim(),
    createdAt: new Date(),
  });
  return id as number;
}

export async function getBeneficiaries(): Promise<Beneficiary[]> {
  return db.beneficiaries.orderBy("createdAt").reverse().toArray();
}

export async function deleteBeneficiary(id: number): Promise<void> {
  await db.beneficiaries.delete(id);
}
