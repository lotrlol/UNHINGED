-- Check if the content_likes table exists and show its structure
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    character_maximum_length,
    is_identity
FROM 
    information_schema.columns 
WHERE 
    table_name = 'content_likes';

-- Check existing RLS policies
SELECT * FROM pg_policies WHERE tablename = 'content_likes';

-- Check foreign key constraints
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'content_likes';
