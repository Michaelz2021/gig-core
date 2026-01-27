export interface PaymentMethod {
  methodId: string;
  name: string;
  type: 'DIGITAL_WALLET' | 'BANK_TRANSFER' | 'CREDIT_CARD';
  isEnabled: boolean;
  icon?: string;
}

