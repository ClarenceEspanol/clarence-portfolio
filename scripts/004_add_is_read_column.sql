-- Add is_read column to contact_messages table
ALTER TABLE contact_messages 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Update existing messages to be marked as unread by default
UPDATE contact_messages SET is_read = FALSE WHERE is_read IS NULL;
