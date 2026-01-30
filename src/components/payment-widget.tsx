'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Modal } from './ui/modal';
import { apiPost } from '@/lib/api';
import { formatSol } from '@/lib/utils';
import type { PaymentRequestResponse, VerifyPaymentResponse } from '@/types';

interface PaymentWidgetProps {
  merchantId: string;
  contentId: string;
  priceLamports: number;
  onPaymentSuccess?: (accessToken: string) => void;
  onPaymentError?: (error: Error) => void;
}

export function PaymentWidget({
  merchantId,
  contentId,
  priceLamports,
  onPaymentSuccess,
  onPaymentError,
}: PaymentWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  
  const handlePurchase = async () => {
    try {
      setIsProcessing(true);
      setError('');
      
      // Create payment request
      const response = await apiPost<PaymentRequestResponse>(
        '/api/payments/create-payment-request',
        { contentId }
      );
      
      setPaymentUrl(response.paymentUrl);
      setPaymentIntentId(response.paymentIntent.id);
      setIsOpen(true);
      
      // Start polling for payment verification
      pollForPayment(response.paymentIntent.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create payment request';
      setError(msg);
      onPaymentError?.(err instanceof Error ? err : new Error(msg));
      setIsProcessing(false);
    }
  };
  
  const pollForPayment = async (intentId: string) => {
    const maxAttempts = 60; // 5 minutes (5 second intervals)
    let attempts = 0;
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        setError('Payment timeout. Please try again.');
        setIsProcessing(false);
        return;
      }
      
      attempts++;
      
      try {
        // In a real implementation, you would:
        // 1. Have the user sign the transaction in their wallet
        // 2. Get the transaction signature
        // 3. Call verify-payment endpoint
        // 4. Create purchase
        
        // For now, this is a placeholder
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // This would be replaced with actual wallet integration
        console.log('Waiting for transaction...');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Payment verification failed');
        setIsProcessing(false);
      }
    };
    
    poll();
  };
  
  return (
    <>
      <Button
        onClick={handlePurchase}
        disabled={isProcessing}
        size="lg"
        className="w-full"
      >
        {isProcessing ? 'Processing...' : `Purchase for ${formatSol(priceLamports)} SOL`}
      </Button>
      
      {error && (
        <p className="text-red-400 text-sm mt-2">{error}</p>
      )}
      
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Complete Payment">
        <div className="text-center">
          <p className="text-neutral-300 mb-4">
            Scan the QR code or open the payment URL in your Solana wallet
          </p>
          {paymentUrl && (
            <div className="mb-4">
              <a
                href={paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Open in Wallet
              </a>
            </div>
          )}
          <p className="text-sm text-neutral-400">
            Payment will be automatically verified once confirmed on-chain
          </p>
        </div>
      </Modal>
    </>
  );
}
