import axios from 'axios';
import { PaystackInitializeResponse, PaystackTransactionData } from '../interfaces/paystack.interface';

class PaystackService {
  private readonly secretKey: string;
  private readonly baseUrl: string = 'https://api.paystack.co';
  
  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }
  
  /**
   * Initialize a Paystack transaction
   */
  async initializePayment(email: string, amount: number, callbackUrl: string): Promise<PaystackInitializeResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        {
          email,
          amount: Math.round(amount * 100), // Convert to kobo/cents
          callback_url: callbackUrl
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.data;
    } catch (error: any) {
      console.log('Paystack initialization error:', error);
      const message = error.response?.data?.message || 'Failed to initialize payment';
      throw new Error(`Paystack initialize error: ${message}`);
    }
  }
  
  /**
   * Verify a Paystack transaction
   */
  async verifyPayment(reference: string): Promise<PaystackTransactionData> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to verify payment';
      throw new Error(`Paystack error: ${message}`);
    }
  }
}

export default PaystackService;