-- Run this on your VM PostgreSQL database to check the actual column name

-- Check the files table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'files' 
ORDER BY ordinal_position;

-- Check if data exists and what the column is called
SELECT * FROM files LIMIT 5;
