export interface DemoClient {
  id: string;
  name: string;
  code: string;
  tier: 'bronce' | 'plata' | 'oro';
  visits: number; // Current cycle (0..10)
  totalVisits: number; // Lifetime visits
  lockedBalance: number;
  availableBalance: number;
  avatar: string;
}

export interface DemoTransaction {
  id: string;
  customerName: string;
  customerCode: string;
  tier: 'bronce' | 'plata' | 'oro';
  type: 'consumo' | 'cupon' | 'cobro';
  amount: number;
  creditEarned: number;
  lockedAmount?: number;
  timestamp: string;
  status: 'completado' | 'pendiente' | 'pagado';
  completedMilestone?: boolean;
}

export interface RewardRuleConfig {
  tier: 'bronce' | 'plata' | 'oro';
  title: string;
  rangeText: string;
  cashbackPerSpend: number; // e.g. 0.50
  rewardAmountOnComplete: number; // e.g. 5.00
  isInstant: boolean;
  description: string;
}

export const INITIAL_REWARD_RULES: RewardRuleConfig[] = [
  {
    tier: 'bronce',
    title: 'Bronce',
    rangeText: '0–9 consumos',
    cashbackPerSpend: 0.50,
    rewardAmountOnComplete: 5.00,
    isInstant: false,
    description: 'por consumo, bloqueado. Al completar 10 consumos se liberan S/ 5.00 al saldo disponible y la tarjeta se reinicia.',
  },
  {
    tier: 'plata',
    title: 'Plata',
    rangeText: '10–29 consumos',
    cashbackPerSpend: 0.70,
    rewardAmountOnComplete: 7.00,
    isInstant: false,
    description: 'por consumo, bloqueado. Al completar 10 consumos se liberan S/ 7.00 al saldo disponible y la tarjeta se reinicia.',
  },
  {
    tier: 'oro',
    title: 'Oro',
    rangeText: '+30 consumos',
    cashbackPerSpend: 1.00,
    rewardAmountOnComplete: 0,
    isInstant: true,
    description: 'por consumo, disponible al instante. Sin tarjeta ni saldo bloqueado (acceso VIP inmediato).',
  },
];

export const INITIAL_DEMO_CLIENTS: DemoClient[] = [
  {
    id: 'c1',
    name: 'Carlos Mendoza',
    code: '+51999999995',
    tier: 'bronce',
    visits: 6,
    totalVisits: 6,
    lockedBalance: 3.00,
    availableBalance: 0.00,
    avatar: 'CM',
  },
  {
    id: 'c2',
    name: 'Camila Ruiz',
    code: '+51999999993',
    tier: 'plata',
    visits: 8,
    totalVisits: 12,
    lockedBalance: 5.60,
    availableBalance: 5.00,
    avatar: 'CR',
  },
  {
    id: 'c3',
    name: 'Lucía Paredes',
    code: '+51999999991',
    tier: 'oro',
    visits: 0,
    totalVisits: 31,
    lockedBalance: 0.00,
    availableBalance: 18.00,
    avatar: 'LP',
  },
  {
    id: 'c4',
    name: 'Diego Salazar',
    code: '+51999999996',
    tier: 'bronce',
    visits: 2,
    totalVisits: 2,
    lockedBalance: 1.00,
    availableBalance: 0.00,
    avatar: 'DS',
  },
  {
    id: 'c5',
    name: 'Valeria Quispe',
    code: '+51999999997',
    tier: 'bronce',
    visits: 9,
    totalVisits: 9,
    lockedBalance: 4.50,
    availableBalance: 0.00,
    avatar: 'VQ',
  },
  {
    id: 'c6',
    name: 'Rosa Chávez',
    code: '+51999999992',
    tier: 'bronce',
    visits: 4,
    totalVisits: 4,
    lockedBalance: 2.00,
    availableBalance: 0.00,
    avatar: 'RC',
  },
  {
    id: 'c7',
    name: 'Jorge Salas',
    code: '+51999999994',
    tier: 'oro',
    visits: 0,
    totalVisits: 34,
    lockedBalance: 0.00,
    availableBalance: 9.00,
    avatar: 'JS',
  },
];

export const INITIAL_DEMO_TRANSACTIONS: DemoTransaction[] = [
  {
    id: 'tx-1',
    customerName: 'Lucía Paredes',
    customerCode: '+51999999991',
    tier: 'oro',
    type: 'consumo',
    amount: 64.00,
    creditEarned: 1.00,
    timestamp: 'Ayer · 14:44',
    status: 'completado',
  },
  {
    id: 'tx-2',
    customerName: 'Rosa Chávez',
    customerCode: '+51999999992',
    tier: 'bronce',
    type: 'consumo',
    amount: 32.00,
    creditEarned: 0.50,
    lockedAmount: 0.50,
    timestamp: '09-nov. · 13:44',
    status: 'completado',
  },
  {
    id: 'tx-3',
    customerName: 'Lucía Paredes',
    customerCode: '+51999999991',
    tier: 'oro',
    type: 'consumo',
    amount: 55.00,
    creditEarned: 1.00,
    timestamp: '09-nov. · 11:44',
    status: 'completado',
  },
  {
    id: 'tx-4',
    customerName: 'Camila Ruiz',
    customerCode: '+51999999993',
    tier: 'plata',
    type: 'consumo',
    amount: 20.00,
    creditEarned: 0.70,
    lockedAmount: 0.70,
    timestamp: '08-nov. · 16:44',
    status: 'completado',
  },
  {
    id: 'tx-5',
    customerName: 'Jorge Salas',
    customerCode: '+51999999994',
    tier: 'oro',
    type: 'consumo',
    amount: 52.00,
    creditEarned: 1.00,
    timestamp: '08-nov. · 12:44',
    status: 'completado',
  },
  {
    id: 'tx-6',
    customerName: 'Lucía Paredes',
    customerCode: '+51999999991',
    tier: 'oro',
    type: 'consumo',
    amount: 23.00,
    creditEarned: 1.00,
    timestamp: '07-nov. · 15:44',
    status: 'completado',
  },
  {
    id: 'tx-7',
    customerName: 'Valeria Quispe',
    customerCode: '+51999999997',
    tier: 'bronce',
    type: 'cupon',
    amount: 45.00,
    creditEarned: 0.50,
    lockedAmount: 0.50,
    timestamp: '06-nov. · 19:20',
    status: 'completado',
  },
  {
    id: 'tx-8',
    customerName: 'Carlos Mendoza',
    customerCode: '+51999999995',
    tier: 'bronce',
    type: 'cobro',
    amount: 80.00,
    creditEarned: 0.50,
    timestamp: '05-nov. · 18:10',
    status: 'pagado',
  },
];

export const DEMO_SALES_BY_DAY = [
  { day: '01 Nov', amount: 48.0 },
  { day: '02 Nov', amount: 92.5 },
  { day: '03 Nov', amount: 65.0 },
  { day: '04 Nov', amount: 35.0 },
  { day: '05 Nov', amount: 80.0 },
  { day: '06 Nov', amount: 110.0 },
  { day: '07 Nov', amount: 45.0 },
  { day: '08 Nov', amount: 72.0 },
  { day: '09 Nov', amount: 87.0 },
  { day: '10 Nov', amount: 32.0 },
  { day: '11 Nov', amount: 64.0 },
  { day: '12 Nov', amount: 55.0 },
  { day: '13 Nov', amount: 42.0 },
  { day: '14 Nov', amount: 28.5 },
];
