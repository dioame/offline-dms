-- Track who each access code was assigned to
ALTER TABLE access_codes ADD COLUMN enumerator_name TEXT;
ALTER TABLE access_codes ADD COLUMN enumerator_email TEXT;
