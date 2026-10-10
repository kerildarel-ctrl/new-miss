export interface TicketPassCategory {
  id: string;
  name: string;
  price: number;
  description: string;
  badge?: string;
}

export interface TicketEvent {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  venue: string;
  city: string;
  bannerImage: string;
  passes: TicketPassCategory[];
}

export interface IssuedTicket {
  id: string;
  ticketCode: string;
  eventId: string;
  eventTitle: string;
  passName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  status: 'VALID' | 'USED';
  purchasedAt: string;
  scannedAt?: string;
}

export const INITIAL_TICKET_EVENTS: TicketEvent[] = [
  {
    id: 'evt-1',
    slug: 'gala-miss-mister-2026',
    title: 'Grande Soirée de Gala & Couronnement 2026',
    subtitle: 'La plus grande nuit de beauté et d’élégance estudiantine',
    date: 'Samedi 15 Novembre 2026 à 20h00',
    venue: 'Palais des Sports / Hôtel Hilton',
    city: 'Yaoundé',
    bannerImage: '/images/hero_bg.png',
    passes: [
      {
        id: 'pass-std',
        name: 'Pass Standard',
        price: 2000,
        description: 'Accès libre à la salle de banquet + 1 boisson offerte.',
      },
      {
        id: 'pass-vip',
        name: 'Pass VIP',
        price: 5000,
        description: 'Place réservée premier rang + cocktail de bienvenue + photo avec les gagnants.',
        badge: 'Plus Populaire',
      },
      {
        id: 'pass-vvip',
        name: 'Table VVIP (5 Personnes)',
        price: 25000,
        description: 'Table privée VIP pour 5 personnes + Bouteille prestige offerte + Service dédié.',
        badge: 'VIP Prestige',
      },
    ],
  },
  {
    id: 'evt-2',
    slug: 'after-party-miss-mister',
    title: 'After-Party Officielle Miss & Mister',
    subtitle: 'Nuit de célébration avec les meilleurs DJs de la capitale',
    date: 'Vendredi 20 Novembre 2026 à 22h30',
    venue: 'Club Prestige Yaoundé',
    city: 'Yaoundé',
    bannerImage: '/images/copa_ahn_banner.png',
    passes: [
      {
        id: 'pass-ap-std',
        name: 'Entrée Club Standard',
        price: 1500,
        description: 'Accès au club toute la nuit.',
      },
      {
        id: 'pass-ap-vip',
        name: 'Pass VIP Carré Or',
        price: 4000,
        description: 'Accès Carré VIP + 1 Conso Offerte.',
        badge: 'Carré Or',
      },
    ],
  },
];

export const INITIAL_ISSUED_TICKETS: IssuedTicket[] = [
  {
    id: 'tck_demo_1',
    ticketCode: 'TCK-89A2F-2026',
    eventId: 'evt-1',
    eventTitle: 'Grande Soirée de Gala & Couronnement 2026',
    passName: 'Pass VIP',
    unitPrice: 5000,
    quantity: 1,
    totalPrice: 5000,
    buyerName: 'Keril Kousso',
    buyerEmail: 'keril.kousso@gmail.com',
    buyerPhone: '692886326',
    status: 'VALID',
    purchasedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'tck_demo_2',
    ticketCode: 'TCK-14B9X-2026',
    eventId: 'evt-1',
    eventTitle: 'Grande Soirée de Gala & Couronnement 2026',
    passName: 'Pass Standard',
    unitPrice: 2000,
    quantity: 2,
    totalPrice: 4000,
    buyerName: 'Marie Claire',
    buyerEmail: 'marie.claire@yahoo.fr',
    buyerPhone: '677123456',
    status: 'USED',
    purchasedAt: new Date(Date.now() - 86400000).toISOString(),
    scannedAt: new Date(Date.now() - 14000000).toISOString(),
  },
];
