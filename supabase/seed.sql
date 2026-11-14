-- ==============================================================================
-- expandeMoney - Seed Data (Piloto Operativo Perú con Reglas EM.R)
-- ==============================================================================

-- 1. Comercios Piloto
INSERT INTO public.merchants (
    id,
    legal_name,
    commercial_name,
    slug,
    ruc,
    category,
    status,
    phone,
    email,
    logo_url,
    brand_color,
    flat_fee_percentage,
    rep_name,
    rep_dni,
    rep_phone,
    rep_email,
    bank_name,
    bank_cci,
    min_spend_for_stamp,
    reward_type,
    reward_title,
    reward_value,
    reward_description
) VALUES 
(
    'a1111111-1111-1111-1111-111111111111',
    'CAFE Y EXPERIENCIAS BARRANCO S.A.C.',
    'Café Barranqueño',
    'cafe-barranqueno',
    '20601234567',
    'Cafetería & Panadería Artesanal',
    'active', -- Aprobado manualmente para el piloto
    '+51912345678',
    'contacto@cafebarranqueno.pe',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=150',
    '#059669',
    5.00,
    'Rodrigo Alarcón Silva',
    '45892134',
    '+51987654320',
    'gerencia@cafebarranqueno.pe',
    'Banco de Crédito del Perú (BCP)',
    '00219400234857291048',
    30.00, -- Consumo mínimo S/ 30.00 para 1 sello
    'free_product', -- Premio configurable: Producto gratis
    'Desayuno Completo o Postre Artesanal Gratis',
    25.00,
    'Válido al completar 10 consumos desde S/ 30.00 en local'
),
(
    'b2222222-2222-2222-2222-222222222222',
    'INVERSIONES GASTRONOMICAS LA BRASA S.R.L.',
    'Pollería La Brasa Dorada',
    'la-brasa-dorada',
    '20549876543',
    'Restaurante & Pollos a la Brasa',
    'active',
    '+51923456789',
    'gerencia@brasadorada.pe',
    'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=150',
    '#D97706',
    5.00,
    'Fernando Quispe Morales',
    '09483726',
    '+51998877665',
    'administracion@brasadorada.pe',
    'Interbank',
    '00305800392817492039',
    30.00,
    'balance_credit', -- Premio configurable: Saldo para consumo
    'S/ 30 de Saldo para tu Consumo',
    30.00,
    'Abono directo a tu Web Wallet al completar los 10 consumos'
)
ON CONFLICT (slug) DO NOTHING;

-- 2. Sedes del Comercio (merchant_branches)
INSERT INTO public.merchant_branches (
    id,
    merchant_id,
    name,
    address,
    district,
    city,
    phone,
    is_main
) VALUES
(
    'd1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'Sede Principal Barranco',
    'Av. Pedro de Osma 135',
    'Barranco',
    'Lima',
    '+5114772819',
    true
),
(
    'd2222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    'Sede Miraflores',
    'Calle Esperanza 184',
    'Miraflores',
    'Lima',
    '+5112419283',
    false
);

-- 3. Clientes Piloto representando los 3 Niveles EM.R:
-- Bronce: 1 a 9 consumos en local (Nivel Inicial)
-- Plata: 10 a 30 consumos en local (Nivel Intermedio - Canjes de cupones de fidelidad)
-- Oro: Más de 30 consumos en local (> 30) (Nivel Top Tier / VIP)
INSERT INTO public.customers (
    id,
    merchant_id,
    full_name,
    phone,
    current_tier,
    total_visits,
    current_cycle_visits,
    available_balance,
    locked_balance,
    total_spent,
    wallet_token
) VALUES
-- Lucía Paredes (ORO: 31 consumos)
(
    'c3333333-3333-3333-3333-333333333331',
    'a1111111-1111-1111-1111-111111111111',
    'Lucía Paredes',
    '+51999999991',
    'oro',
    31,
    0,
    18.00,
    0.00,
    1920.00,
    'token_lucia_oro_barranco'
),
-- Rosa Chávez (BRONCE: 4 consumos)
(
    'c3333333-3333-3333-3333-333333333332',
    'a1111111-1111-1111-1111-111111111111',
    'Rosa Chávez',
    '+51999999992',
    'bronce',
    4,
    4,
    0.00,
    2.00,
    160.00,
    'token_rosa_bronce_barranco'
),
-- Camila Ruiz (PLATA: 12 consumos)
(
    'c3333333-3333-3333-3333-333333333333',
    'a1111111-1111-1111-1111-111111111111',
    'Camila Ruiz',
    '+51999999993',
    'plata',
    12,
    8,
    5.00,
    5.60,
    540.00,
    'token_camila_plata_barranco'
),
-- Jorge Salas (ORO: 34 consumos)
(
    'c3333333-3333-3333-3333-333333333334',
    'a1111111-1111-1111-1111-111111111111',
    'Jorge Salas',
    '+51999999994',
    'oro',
    34,
    0,
    9.00,
    0.00,
    2150.00,
    'token_jorge_oro_barranco'
),
-- Carlos Mendoza (BRONCE: 6 consumos)
(
    'c3333333-3333-3333-3333-333333333335',
    'a1111111-1111-1111-1111-111111111111',
    'Carlos Mendoza',
    '+51999999995',
    'bronce',
    6,
    6,
    0.00,
    3.00,
    280.00,
    'token_carlos_bronce_barranco'
),
-- Diego Salazar (BRONCE: 2 consumos)
(
    'c3333333-3333-3333-3333-333333333336',
    'a1111111-1111-1111-1111-111111111111',
    'Diego Salazar',
    '+51999999996',
    'bronce',
    2,
    2,
    0.00,
    1.00,
    95.00,
    'token_diego_bronce_barranco'
),
-- Valeria Quispe (BRONCE: 9 consumos)
(
    'c3333333-3333-3333-3333-333333333337',
    'a1111111-1111-1111-1111-111111111111',
    'Valeria Quispe',
    '+51999999997',
    'bronce',
    9,
    9,
    0.00,
    4.50,
    490.00,
    'token_valeria_bronce_barranco'
)
ON CONFLICT (merchant_id, phone) DO NOTHING;

-- 4. Transacciones Iniciales
INSERT INTO public.transactions (
    id,
    merchant_id,
    customer_id,
    customer_name,
    customer_phone,
    type,
    gross_amount,
    qualified_for_stamp,
    platform_fee_pct,
    platform_fee_amount,
    net_merchant_amount,
    cashback_pct_applied,
    cashback_earned,
    cashback_redeemed,
    status,
    payment_method,
    reference_code,
    created_at
) VALUES
(
    gen_random_uuid(),
    'a1111111-1111-1111-1111-111111111111',
    'c3333333-3333-3333-3333-333333333331',
    'Lucía Paredes',
    '+51999999991',
    'in_store_sale',
    64.00,
    true,
    5.00,
    3.20,
    60.80,
    0.00,
    1.00,
    0.00,
    'completed',
    'yape',
    'EXP-261111-001',
    now() - interval '1 hour'
),
(
    gen_random_uuid(),
    'a1111111-1111-1111-1111-111111111111',
    'c3333333-3333-3333-3333-333333333335',
    'Carlos Mendoza',
    '+51999999995',
    'in_store_sale',
    80.00,
    true,
    5.00,
    4.00,
    76.00,
    0.00,
    0.50,
    0.00,
    'completed',
    'plin',
    'EXP-261111-002',
    now() - interval '3 hours'
),
(
    gen_random_uuid(),
    'a1111111-1111-1111-1111-111111111111',
    'c3333333-3333-3333-3333-333333333332',
    'Rosa Chávez',
    '+51999999992',
    'in_store_sale',
    32.00,
    true,
    5.00,
    1.60,
    30.40,
    0.00,
    0.50,
    0.00,
    'completed',
    'tarjeta',
    'EXP-261111-003',
    now() - interval '6 hours'
);

-- 5. Cupones de Recompensa
INSERT INTO public.coupons (
    merchant_id,
    customer_id,
    code,
    title,
    reward_type,
    discount_amount,
    min_spend,
    status,
    expires_at
) VALUES 
(
    'a1111111-1111-1111-1111-111111111111',
    'c3333333-3333-3333-3333-333333333331',
    'PREMIO10-BARRANCO',
    'Premio 10 Consumos: Desayuno Completo o Postre Gratis',
    'free_product',
    25.00,
    0.00,
    'active',
    now() + interval '28 days'
)
ON CONFLICT (code) DO NOTHING;
