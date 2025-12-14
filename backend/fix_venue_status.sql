-- Fix venue status ENUM to include all required values
-- This fixes the "Data truncated for column 'status' at row 1" error

-- Update the venues table to modify the status column ENUM
ALTER TABLE venues 
MODIFY COLUMN status ENUM('active', 'inactive', 'pending', 'rejected') DEFAULT 'pending';
