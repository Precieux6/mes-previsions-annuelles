-- Séparer les années : une commande 2027 n'est jamais confondue avec une commande 2028.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS annee SMALLINT NOT NULL DEFAULT 2027;
CREATE INDEX IF NOT EXISTS orders_annee_idx ON orders (annee, reference);
