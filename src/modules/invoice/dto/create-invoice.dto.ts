export class CreateInvoiceDto {
  patientId: string;
  doctorId: string;
  clinicId: string;
  items: Array<{
    id: string;
    type: 'service' | 'lab' | 'medicine';
    itemId: string;
    itemName?: string;
    quantity?: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  profit: number;
  profitMargin: number;
  actualCostSubtotal: number;
  actualCostTaxAmount: number;
  actualCostTotal: number;
  status: string;
  paymentMethod: string;
  amoutPaid?: number;
  amountRemaining?: number;
}
