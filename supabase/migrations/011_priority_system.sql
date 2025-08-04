-- Add priority system to manuscripts
-- This migration adds priority levels and messaging system support

-- Add priority column to manuscripts table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'manuscripts' AND column_name = 'priority') THEN
        ALTER TABLE manuscripts ADD COLUMN priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
    END IF;
END $$;

-- Add index on priority for faster sorting
CREATE INDEX IF NOT EXISTS idx_manuscripts_priority ON manuscripts(priority);

-- Create manuscript_messages table for editor-author communication
CREATE TABLE IF NOT EXISTS manuscript_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    manuscript_id UUID NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'general' CHECK (message_type IN ('general', 'request', 'decision', 'revision', 'system')),
    parent_message_id UUID REFERENCES manuscript_messages(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for manuscript_messages
CREATE INDEX IF NOT EXISTS idx_manuscript_messages_manuscript_id ON manuscript_messages(manuscript_id);
CREATE INDEX IF NOT EXISTS idx_manuscript_messages_sender_id ON manuscript_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_manuscript_messages_recipient_id ON manuscript_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_manuscript_messages_created_at ON manuscript_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manuscript_messages_thread ON manuscript_messages(parent_message_id);

-- Enable RLS on manuscript_messages
ALTER TABLE manuscript_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for manuscript_messages
-- Authors can see messages for their manuscripts
CREATE POLICY "Authors can view messages for their manuscripts" ON manuscript_messages
    FOR SELECT USING (
        manuscript_id IN (
            SELECT id FROM manuscripts WHERE author_id = auth.uid()
        )
    );

-- Editors and admins can see all messages
CREATE POLICY "Editors can view all messages" ON manuscript_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('editor', 'admin')
        )
    );

-- Authors can send messages for their manuscripts
CREATE POLICY "Authors can send messages for their manuscripts" ON manuscript_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid()
        AND manuscript_id IN (
            SELECT id FROM manuscripts WHERE author_id = auth.uid()
        )
    );

-- Editors and admins can send messages
CREATE POLICY "Editors can send messages" ON manuscript_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('editor', 'admin')
        )
    );

-- Users can update read status of messages sent to them
CREATE POLICY "Users can update read status of their messages" ON manuscript_messages
    FOR UPDATE USING (recipient_id = auth.uid())
    WITH CHECK (recipient_id = auth.uid());

-- Create function to update manuscript priority
CREATE OR REPLACE FUNCTION update_manuscript_priority(
    manuscript_id UUID,
    new_priority VARCHAR(10)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is editor or admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('editor', 'admin')
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions';
    END IF;

    -- Update manuscript priority
    UPDATE manuscripts 
    SET priority = new_priority, 
        updated_at = NOW()
    WHERE id = manuscript_id;

    -- Log the priority change
    INSERT INTO manuscript_messages (
        manuscript_id,
        sender_id,
        recipient_id,
        message,
        message_type
    )
    SELECT 
        manuscript_id,
        auth.uid(),
        m.author_id,
        'Manuscript priority updated to: ' || new_priority,
        'system'
    FROM manuscripts m
    WHERE m.id = manuscript_id;
END;
$$;

-- Create function to get message thread
CREATE OR REPLACE FUNCTION get_message_thread(thread_manuscript_id UUID)
RETURNS TABLE (
    id UUID,
    manuscript_id UUID,
    sender_id UUID,
    recipient_id UUID,
    message TEXT,
    message_type VARCHAR(20),
    parent_message_id UUID,
    is_read BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    sender_name TEXT,
    sender_role VARCHAR(20),
    recipient_name TEXT,
    recipient_role VARCHAR(20)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user has access to this manuscript
    IF NOT EXISTS (
        SELECT 1 FROM manuscripts m
        WHERE m.id = thread_manuscript_id
        AND (
            m.author_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('editor', 'admin')
            )
        )
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT 
        mm.id,
        mm.manuscript_id,
        mm.sender_id,
        mm.recipient_id,
        mm.message,
        mm.message_type,
        mm.parent_message_id,
        mm.is_read,
        mm.created_at,
        ps.full_name as sender_name,
        ps.role as sender_role,
        pr.full_name as recipient_name,
        pr.role as recipient_role
    FROM manuscript_messages mm
    JOIN profiles ps ON mm.sender_id = ps.id
    JOIN profiles pr ON mm.recipient_id = pr.id
    WHERE mm.manuscript_id = thread_manuscript_id
    ORDER BY mm.created_at ASC;
END;
$$;

-- Create function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(message_ids UUID[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE manuscript_messages
    SET is_read = TRUE, updated_at = NOW()
    WHERE id = ANY(message_ids)
    AND recipient_id = auth.uid();
END;
$$;

-- Update manuscripts priority based on urgency factors
-- This is a one-time update to set initial priorities
UPDATE manuscripts 
SET priority = CASE 
    WHEN status = 'awaiting_decision' AND created_at < NOW() - INTERVAL '30 days' THEN 'high'
    WHEN status = 'awaiting_decision' AND created_at < NOW() - INTERVAL '21 days' THEN 'normal'
    WHEN status = 'revisions_requested' AND updated_at < NOW() - INTERVAL '60 days' THEN 'urgent'
    WHEN status = 'revisions_requested' AND updated_at < NOW() - INTERVAL '45 days' THEN 'high'
    WHEN status = 'in_review' AND created_at < NOW() - INTERVAL '45 days' THEN 'high'
    WHEN status = 'submitted' AND created_at < NOW() - INTERVAL '7 days' THEN 'normal'
    ELSE 'normal'
END
WHERE priority = 'normal'; -- Only update if not already set