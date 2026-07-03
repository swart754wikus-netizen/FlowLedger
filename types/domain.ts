// Firestore data shapes for FlowLedger.
// Top-level collection: businesses/{businessId}
// Subcollections: invoices, expenses, transactions, customers, suppliers,
// notifications, accountants, healthScores

export type InvoiceStatus = 'pending' | 'part_paid' | 'paid' | 'cancelled';
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'converted';
export type VatTreatment = 'inclusive' | 'exclusive' | 'zero_rated' | 'exempt';
export type TransactionType = 'income' | 'expense';
export type UserRole = 'owner' | 'staff' | 'accountant';

export interface Business {
  id: string;
  name: string;
  tradingName?: string;
  vatNumber?: string;
  vatRegistered: boolean;
  vatPeriodMonths: 2 | 1; // bi-monthly (SA default) or monthly
  currency: 'ZAR';
  createdAt: number;
}

export interface UserProfile {
  id: string; // Firebase Auth UID
  businessId: string;
  fullName: string;
  email: string;
  role: UserRole;
  onboardingComplete: boolean;
  createdAt: number;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatTreatment: VatTreatment;
  total: number; // computed
}

export interface Invoice {
  id: string;
  businessId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string; // denormalized
  status: InvoiceStatus;
  issueDate: string; // ISO date
  dueDate: string;
  lineItems: LineItem[];
  discountPct: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Quote {
  id: string;
  businessId: string;
  quoteNumber: string;
  customerId: string;
  customerName: string; // denormalized
  status: QuoteStatus;
  issueDate: string; // ISO date
  expiryDate: string;
  lineItems: LineItem[];
  discountPct: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  notes?: string;
  convertedInvoiceId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Expense {
  id: string;
  businessId: string;
  supplierId?: string;
  supplierName?: string;
  category: string;
  date: string;
  amount: number; // gross amount
  vatTreatment: VatTreatment;
  vatAmount: number;
  receiptUrl?: string;
  notes?: string;
  createdAt: number;
}

export interface Transaction {
  id: string;
  businessId: string;
  type: TransactionType;
  date: string;
  amount: number;
  vatAmount: number;
  reference: string; // invoice number or expense category
  category: string;
  status: string;
  sourceType: 'invoice' | 'expense';
  sourceId: string;
  createdAt: number;
}

export interface Customer {
  id: string;
  businessId: string;
  company: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  notes?: string;
  outstandingBalance: number; // computed/cached
  createdAt: number;
}

export interface Supplier {
  id: string;
  businessId: string;
  company: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  outstandingBalance: number;
  vatClaimedTotal: number;
  createdAt: number;
}

export interface HealthScore {
  id: string;
  businessId: string;
  overallScore: number;
  cashflowScore: number;
  profitabilityScore: number;
  vatComplianceScore: number;
  growthScore: number;
  calculatedAt: number;
}

export interface NotificationItem {
  id: string;
  businessId: string;
  type: 'invoice_overdue' | 'vat_due' | 'cashflow_negative' | 'bill_overdue' | 'payment_received';
  title: string;
  body: string;
  read: boolean;
  createdAt: number;
}

export interface AccountantInvite {
  id: string;
  businessId: string;
  email: string;
  status: 'pending' | 'accepted';
  invitedAt: number;
}
