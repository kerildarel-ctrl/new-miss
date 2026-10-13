export interface TicketPassCategory {
  id: string;
  name: string;
  price: number;
  quantity?: number;
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
  htmlContent?: string;
  passes: TicketPassCategory[];
  organizerName?: string;
  organizerEmail?: string;
  organizerPhone?: string;
  organizerToken?: string;
  status?: string;
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
  orderRef?: string;
  paymentStatus?: 'PAID' | 'PENDING' | 'FAILED' | 'CONFIRMED';
  status: 'VALID' | 'USED';
  purchasedAt: string;
  scannedAt?: string;
  scannedByAgentId?: string;
  scannedByAgentName?: string;
}


// REUSABLE TICKET TEMPLATES FOR ADMIN TO SELECT WHEN CREATING EVENTS
export const TICKET_PASS_TEMPLATES: TicketPassCategory[] = [
  {
    id: 'pass-template-std',
    name: 'Pass Standard',
    price: 2000,
    description: 'Accès général à l’événement + 1 boisson offerte.',
  },
  {
    id: 'pass-template-vip',
    name: 'Pass VIP',
    price: 5000,
    description: 'Place réservée premier rang + cocktail de bienvenue + photo souvenir.',
    badge: 'Plus Populaire',
  },
  {
    id: 'pass-template-vvip',
    name: 'Table VVIP (5 Personnes)',
    price: 25000,
    description: 'Table privée VIP pour 5 personnes + Bouteille prestige offerte + Service dédié.',
    badge: 'VIP Prestige',
  },
  {
    id: 'pass-template-after',
    name: 'Pass After-Party Club',
    price: 1500,
    description: 'Accès au club et à la fête d’après-élection toute la nuit.',
  },
];

// INITIAL EVENTS IS NOW EMPTY (EVENTS ARE ADDED FROM ADMIN DASHBOARD BY THE USER)
export const INITIAL_TICKET_EVENTS: TicketEvent[] = [];

export const INITIAL_ISSUED_TICKETS: IssuedTicket[] = [];
