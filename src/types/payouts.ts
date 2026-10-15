/**
 * Shared PayoutRequest type — used in both server routes and client components.
 * Avoids importing from an API route file in client components.
 */
export interface PayoutRequest {
  id: string;
  competitionSlug: string;
  competitionTitle: string;
  organizerName: string;
  organizerPhone: string;
  operator: 'MTN_MOMO' | 'ORANGE_MONEY';
  amount: number;
  status: 'PENDING' | 'PAID' | 'REJECTED';
  createdAt: string;
  paidAt?: string;
  transactionRef?: string;
  organizerToken?: string;
}
