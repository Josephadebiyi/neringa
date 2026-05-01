-- Sender onboarding: phone verification, shipment terms, item categories
-- Safe to re-run (all IF NOT EXISTS)

-- 1. Phone verification columns on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified      BOOLEAN     DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified_at   TIMESTAMPTZ;

-- 2. Shipment terms acceptances
CREATE TABLE IF NOT EXISTS public.shipment_terms_acceptances (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  terms_version  TEXT        NOT NULL DEFAULT '1.0',
  accepted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address     TEXT,
  user_agent     TEXT,
  device_info    JSONB       DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS sta_user_version_idx ON public.shipment_terms_acceptances(user_id, terms_version);
CREATE INDEX IF NOT EXISTS sta_user_idx ON public.shipment_terms_acceptances(user_id);

-- 3. Item categories (admin-configurable)
CREATE TABLE IF NOT EXISTS public.item_categories (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT         NOT NULL,
  slug                TEXT         NOT NULL UNIQUE,
  risk_level          TEXT         NOT NULL CHECK (risk_level IN ('allowed', 'medium', 'prohibited')),
  description         TEXT,
  warning_message     TEXT,
  display_order       INTEGER      DEFAULT 0,
  is_active           BOOLEAN      DEFAULT TRUE,
  requires_review     BOOLEAN      DEFAULT FALSE,
  max_declared_value  NUMERIC(12,2),
  created_at          TIMESTAMPTZ  DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ic_risk_level_idx ON public.item_categories(risk_level);
CREATE INDEX IF NOT EXISTS ic_active_idx     ON public.item_categories(is_active);

-- 4. Seed categories (safe: INSERT … ON CONFLICT DO NOTHING)
INSERT INTO public.item_categories (name, slug, risk_level, description, warning_message, display_order, requires_review, max_declared_value) VALUES
-- ALLOWED
('Clothes',                'clothes',           'allowed',    'Clothing items, garments, textiles',            NULL, 10, FALSE, 2000),
('Shoes',                  'shoes',             'allowed',    'Footwear of all types',                         NULL, 11, FALSE, 1000),
('Books',                  'books',             'allowed',    'Books, magazines, printed materials',           NULL, 12, FALSE,  500),
('Documents',              'documents',         'allowed',    'Standard documents (not IDs or passports)',     NULL, 13, FALSE,  100),
('Small Accessories',      'small-accessories', 'allowed',    'Bags, belts, hats, scarves, wallets',           NULL, 14, FALSE,  500),
('Toys & Games',           'toys',              'allowed',    'Non-electronic toys and board games',           NULL, 15, FALSE,  500),
('Small Household Items',  'household',         'allowed',    'Small non-fragile household accessories',       NULL, 16, FALSE,  300),
('Lightweight Gifts',      'gifts',             'allowed',    'Legal, non-restricted gift items',              NULL, 17, FALSE,  500),

-- MEDIUM (warning shown, risk scoring applied)
('Electronics',            'electronics',       'medium',     'Phones, laptops, tablets, gadgets',             'Electronics are high-value and attract customs attention. Declare the exact value.', 30, TRUE,  5000),
('Cosmetics & Beauty',     'cosmetics',         'medium',     'Skincare, makeup, perfumes under 100ml',        'Liquids and aerosols have airline restrictions. Check allowed quantities.', 31, TRUE,  1000),
('Food Items',             'food',              'medium',     'Packaged, non-perishable food',                 'Food items may be subject to customs inspection. No perishables.', 32, TRUE,   500),
('Fragile Items',          'fragile',           'medium',     'Ceramics, glassware, delicate items',           'Traveler must agree to handle fragile items carefully. Extra packaging required.', 33, FALSE, 2000),
('Liquids',                'liquids',           'medium',     'Non-hazardous liquids properly sealed',         'Liquids must be under 100ml per container and airline-compliant.',      34, TRUE,   300),
('Batteries & Powerbanks', 'batteries',         'medium',     'Lithium batteries, power banks under 100Wh',   'Lithium batteries are regulated by airlines. Must be within allowed limits.', 35, TRUE,   500),
('Sealed Retail Packages', 'sealed-retail',     'medium',     'Factory-sealed retail products',                'Traveler may request to open sealed items for inspection.',            36, TRUE,  2000),
('High-Value Accessories', 'high-value-acc',    'medium',     'Watches, sunglasses, luxury accessories',       'High-value accessories require accurate declaration. May trigger KYC.',  37, TRUE,  3000),

-- PROHIBITED
('Cash & Currency',        'cash',              'prohibited', 'Physical cash, banknotes, coins',               'Carrying undeclared cash is illegal and prohibited on Bago.',           90, FALSE, NULL),
('Bank Cards',             'bank-cards',        'prohibited', 'Credit/debit cards, financial cards',           'Sending bank cards is prohibited for fraud prevention.',               91, FALSE, NULL),
('Passports & IDs',        'ids-passports',     'prohibited', 'Passports, national IDs, residence permits',   'Sending ID documents is illegal and prohibited.',                       92, FALSE, NULL),
('Visas & Permits',        'visas',             'prohibited', 'Visas, work permits, residency documents',      'Sending immigration documents is illegal and prohibited.',              93, FALSE, NULL),
('SIM Cards',              'sim-cards',         'prohibited', 'Mobile SIM cards',                              'SIM cards are prohibited due to fraud risk.',                           94, FALSE, NULL),
('Medication & Pills',     'medication',        'prohibited', 'Prescription drugs, tablets, pills',            'Medication requires customs declaration and is prohibited on Bago.',    95, FALSE, NULL),
('Drugs & Substances',     'drugs',             'prohibited', 'Illegal drugs or controlled substances',        'Strictly prohibited. Will be reported to authorities.',                 96, FALSE, NULL),
('Weapons',                'weapons',           'prohibited', 'Guns, knives, tasers, weapons of any kind',     'Weapons are strictly prohibited.',                                      97, FALSE, NULL),
('Alcohol',                'alcohol',           'prohibited', 'Alcoholic beverages',                           'Alcohol is prohibited. Check destination country laws.',                98, FALSE, NULL),
('Tobacco & Vapes',        'tobacco',           'prohibited', 'Cigarettes, tobacco, vaping products',          'Tobacco products are prohibited.',                                      99, FALSE, NULL),
('Chemicals & Hazardous',  'chemicals',         'prohibited', 'Chemicals, flammables, hazardous materials',   'Strictly prohibited. Safety risk.',                                    100, FALSE, NULL),
('Gold & Precious Metals', 'gold',              'prohibited', 'Gold, silver, precious metals',                 'Precious metals require special permits and are prohibited on Bago.',  101, FALSE, NULL),
('High-Value Jewelry',     'jewelry-high',      'prohibited', 'Jewelry above platform threshold',              'High-value jewelry is prohibited without special authorization.',       102, FALSE, NULL),
('Crypto & Seed Phrases',  'crypto',            'prohibited', 'Hardware wallets, seed phrases, crypto devices','Prohibited for security reasons.',                                    103, FALSE, NULL),
('Live Animals',           'animals',           'prohibited', 'Any live animals',                              'Transporting live animals without proper authorization is illegal.',   104, FALSE, NULL),
('Perishable Goods',       'perishables',       'prohibited', 'Fresh food, refrigerated items, flowers',       'Perishable goods are prohibited.',                                     105, FALSE, NULL),
('Counterfeit Items',      'counterfeit',       'prohibited', 'Fake, stolen, or undeclared goods',             'Strictly prohibited. Will be reported to authorities.',                106, FALSE, NULL),
('Powders',                'powders',           'prohibited', 'Unknown powders or substances',                 'Unknown powders are prohibited on flights.',                           107, FALSE, NULL)
ON CONFLICT (slug) DO NOTHING;
