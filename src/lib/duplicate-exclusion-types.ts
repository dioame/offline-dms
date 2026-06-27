export type DuplicatePairExclusion = {
  id: number;
  uuid_a: string;
  uuid_b: string;
  name_key: string;
  excluded_at: string;
  excluded_by: string;
  note: string;
};

export type DuplicateExclusionCacheEntry = {
  pair_key: string;
  uuid_a: string;
  uuid_b: string;
  name_key: string;
};
