-- Add artisan role for users managed by backoffice
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ARTISAN';
