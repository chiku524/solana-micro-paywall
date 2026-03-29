-- Drop old tables with PascalCase names
DROP TABLE IF EXISTS MerchantFollow;
DROP TABLE IF EXISTS ReferralCode;
DROP TABLE IF EXISTS Referral;
DROP TABLE IF EXISTS ApiKey;
DROP TABLE IF EXISTS ApiKeyUsage;
DROP TABLE IF EXISTS RefundRequest;
DROP TABLE IF EXISTS DashboardEvent;
DROP TABLE IF EXISTS LedgerEvent;
DROP TABLE IF EXISTS Bookmark;
DROP TABLE IF EXISTS Purchase;
DROP TABLE IF EXISTS AccessToken;
DROP TABLE IF EXISTS Payment;
DROP TABLE IF EXISTS PaymentIntent;
-- Do NOT drop Content: SQLite folds unquoted identifiers to the same name as `content`
-- from 0001_initial_schema.sql, so this would destroy the new schema's content table.
-- Legacy PascalCase "Content" is the same table as lowercase content in SQLite.
DROP TABLE IF EXISTS Merchant;

