import type { FacedRecordData } from "./faced-types";
import type { TursoExportRecord } from "./faced-export-shared";

export type FacedRecordAdminClient = TursoExportRecord;

export function adminRecordToFormData(record: FacedRecordAdminClient): FacedRecordData {
  const {
    uuid: _uuid,
    sync_status: _sync,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...data
  } = record;
  return data;
}
