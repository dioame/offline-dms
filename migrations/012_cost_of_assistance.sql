-- migration: 012_cost_of_assistance
ALTER TABLE family_assistance_record
  ADD COLUMN cost_of_assistance TEXT NOT NULL DEFAULT '';
