export interface PaystackInitializeResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackTransactionData {
  id: number;
  status: string;
  reference: string;
  amount: number;
  paid_at: string | null;
  created_at: string;
  channel: string;
  currency: string;
  customer: {
    email: string;
    name?: string;
  };
}