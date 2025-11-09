-- Add new fields to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS probability numeric DEFAULT 0.5 CHECK (probability >= 0 AND probability <= 1);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS associated_contact_id uuid REFERENCES leads(id);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS last_activity_at timestamp with time zone DEFAULT now();
ALTER TABLE deals ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';

-- Update stage column to use proper enum values
ALTER TABLE deals ALTER COLUMN stage DROP DEFAULT;
ALTER TABLE deals ALTER COLUMN stage TYPE text;
ALTER TABLE deals ALTER COLUMN stage SET DEFAULT 'prospect';

-- Update existing stages to new format (if any exist)
UPDATE deals SET stage = LOWER(stage);

-- Enable full replica identity for realtime
ALTER TABLE deals REPLICA IDENTITY FULL;