-- Migration: Add email service configuration to site_settings
-- This allows admins to configure email service credentials from the admin panel

-- Add email_service_config column to site_settings table
ALTER TABLE site_settings 
ADD COLUMN IF NOT EXISTS email_service_config TEXT;

-- The email_service_config will store JSON in the format:
-- {
--   "service": "resend" | "sendgrid" | "ses" | "smtp" | "none",
--   "apiKey": "your_api_key_here" (for resend/sendgrid),
--   "apiUrl": "https://api.example.com" (for ses/smtp),
--   "fromEmail": "noreply@yourdomain.com"
-- }

