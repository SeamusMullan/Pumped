-- Anonymize IP addresses older than 30 days for GDPR compliance
UPDATE fuel_prices SET client_ip = 'anonymized'
WHERE client_ip != 'anonymized'
  AND client_ip IS NOT NULL
  AND submitted_at < datetime('now', '-30 days');
