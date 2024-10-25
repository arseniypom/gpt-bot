interface IAmount {
  value: string;
  currency: string;
}

interface ICheckoutCustomer {
  full_name?: string;
  inn?: string;
  email?: string;
  phone?: string;
}

type IPaymentSubject =
  | 'commodity'
  | 'excise'
  | 'job'
  | 'service'
  | 'gambling_bet'
  | 'gambling_prize'
  | 'lottery'
  | 'lottery_prize'
  | 'intellectual_activity'
  | 'payment'
  | 'agent_commission'
  | 'property_right'
  | 'non_operating_gain'
  | 'insurance_premium'
  | 'sales_tax'
  | 'resort_fee'
  | 'composite'
  | 'another';

type IPaymentMode =
  | 'full_prepayment'
  | 'partial_prepayment'
  | 'advance'
  | 'full_payment'
  | 'partial_payment'
  | 'credit'
  | 'credit_payment';

type IAgentType =
  | 'banking_payment_agent'
  | 'banking_payment_subagent'
  | 'payment_agent'
  | 'payment_subagent'
  | 'attorney'
  | 'commissioner'
  | 'agent';

interface IItem {
  description: string;
  quantity: string;
  amount: IAmount;
  vat_code: number;
  payment_subject?: IPaymentSubject;
  payment_mode?: IPaymentMode;
  product_code?: string;
  country_of_origin_code?: string;
  customs_declaration_number?: string;
  excise?: string;
  supplier?: {
    name?: string;
    phone?: string;
    inn?: string;
  };
  agent_type?: IAgentType;
}
type IItemWithoutData = Omit<IItem, 'supplier' | 'agent_type'>;

interface IReceipt {
  customer?: ICheckoutCustomer;
  items: IItemWithoutData[];
  tax_system_code?: number;
  phone?: string;
  email?: string;
}

interface IRecipient {
  account_id?: string;
  gateway_id: string;
}

type IRecipientWithoutId = Omit<IRecipient, 'account_id'>;

type IPaymentMethodType =
  | 'bank_card'
  | 'apple_pay'
  | 'google_pay'
  | 'yoo_money'
  | 'qiwi'
  | 'webmoney'
  | 'sberbank'
  | 'alfabank'
  | 'tinkoff_bank'
  | 'b2b_sberbank'
  | 'sbp'
  | 'mobile_balance'
  | 'cash'
  | 'installments';

type IVatDataType = 'untaxed' | 'calculated' | 'mixed';

interface IVatData {
  type: IVatDataType;
  amount?: IAmount;
  rate?: string;
}

interface IPaymentMethodData {
  type: IPaymentMethodType;
  login?: string;
  phone?: string;
  payment_purpose?: string;
  vat_data?: IVatData;
  card?: {
    number: string;
    expiry_month: string;
    expiry_year: string;
    cardholder: string;
    csc: string;
  };
  payment_data?: string;
  payment_method_token?: string;
}

type IConfirmationType = 'embedded' | 'external' | 'qr' | 'redirect';

interface IConfirmation {
  type: IConfirmationType;
  locale?: string;
  confirmation_token?: string;
  confirmation_data?: string;
  confirmation_url?: string;
  enforce?: boolean;
  return_url?: string;
}

type IConfirmationWithoutData = Omit<
  IConfirmation,
  'confirmation_token' | 'confirmation_data' | 'confirmation_url'
>;

enum PaymentStatuses {
  'waiting_for_capture' = 'waiting_for_capture',
  'pending' = 'pending',
  'succeeded' = 'succeeded',
  'canceled' = 'canceled',
}

interface ITransfer {
  account_id: string;
  amount: IAmount;
  status?: keyof typeof PaymentStatuses;
  platform_fee_amount: IAmount;
}

type ITransferWithoutStatus = Omit<ITransfer, 'status'>;

export interface ICreatePayment {
  amount: IAmount;
  description?: string;
  receipt?: IReceipt;
  recipient?: IRecipientWithoutId;
  payment_token?: string;
  payment_method_id?: string;
  payment_method_data?: IPaymentMethodData;
  confirmation?: IConfirmationWithoutData;
  save_payment_method?: boolean;
  capture?: boolean;
  client_ip?: string;
  metadata?: any;
  airline?: unknown;
  transfers?: ITransferWithoutStatus[];
  merchant_customer_id?: string;
}
