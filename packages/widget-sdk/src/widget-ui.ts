import type { PaymentRequestResponse, WidgetConfig } from './types.js';
import { PaymentWidget } from './payment-widget.js';
import type { PaymentRequestConfig } from './types.js';

export interface WidgetUIOptions extends WidgetConfig {
  containerId?: string;
  container?: HTMLElement;
}

export class PaymentWidgetUI {
  private widget: PaymentWidget;
  private container: HTMLElement;
  private modal: HTMLElement | null = null;
  private config: WidgetUIOptions;

  constructor(options: WidgetUIOptions) {
    this.config = options;
    this.widget = new PaymentWidget(options);

    // Find or create container
    if (options.container) {
      this.container = options.container;
    } else if (options.containerId) {
      const el = document.getElementById(options.containerId);
      if (!el) throw new Error(`Container with id "${options.containerId}" not found`);
      this.container = el;
    } else {
      throw new Error('Either container or containerId must be provided');
    }

    this.setupListeners();
  }

  private setupListeners(): void {
    this.widget.on('payment', (event) => {
      if (event.type === 'payment_confirmed') {
        this.hideModal();
      }
    });
  }

  /**
   * Render payment button
   */
  renderButton(paymentConfig: PaymentRequestConfig): void {
    const button = document.createElement('button');
    button.className = this.config.buttonClass || 'solana-pay-button';
    button.textContent = this.config.buttonText || 'Pay with Solana';
    button.style.cssText = `
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #9945FF 0%, #14F195 100%);
      color: white;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 4px 12px rgba(153, 69, 255, 0.4)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = 'none';
    });

    button.addEventListener('click', () => this.handlePayment(paymentConfig));

    this.container.innerHTML = '';
    this.container.appendChild(button);
  }

  /**
   * Show payment modal with QR code
   */
  async showModal(paymentRequest: PaymentRequestResponse): Promise<void> {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'solana-pay-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'solana-pay-modal';
    modal.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      position: relative;
    `;

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 12px;
      right: 12px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
    `;
    closeBtn.addEventListener('click', () => this.hideModal());

    // Title
    const title = document.createElement('h3');
    title.textContent = 'Pay with Solana';
    title.style.cssText = `
      margin: 0 0 16px 0;
      font-size: 20px;
      font-weight: 600;
    `;

    // QR Code container
    const qrContainer = document.createElement('div');
    qrContainer.id = 'solana-pay-qr';
    qrContainer.style.cssText = `
      display: flex;
      justify-content: center;
      margin: 16px 0;
    `;

    // Amount display
    const amount = document.createElement('div');
    const amountInSol = (Number(paymentRequest.amount) / 1e9).toFixed(4);
    amount.textContent = `${amountInSol} ${paymentRequest.currency}`;
    amount.style.cssText = `
      text-align: center;
      font-size: 24px;
      font-weight: 600;
      margin: 16px 0;
      color: #9945FF;
    `;

    // Instructions
    const instructions = document.createElement('p');
    instructions.textContent = 'Scan QR code with your Solana wallet or click "Connect Wallet" below';
    instructions.style.cssText = `
      text-align: center;
      color: #666;
      font-size: 14px;
      margin: 16px 0;
    `;

    // Wallet button
    const walletBtn = document.createElement('button');
    walletBtn.textContent = 'Connect Wallet & Pay';
    walletBtn.style.cssText = `
      width: 100%;
      padding: 12px;
      font-size: 16px;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #9945FF 0%, #14F195 100%);
      color: white;
      cursor: pointer;
      margin-top: 16px;
    `;
    walletBtn.addEventListener('click', async () => {
      try {
        walletBtn.disabled = true;
        walletBtn.textContent = 'Processing...';
        await this.widget.connectWalletAndPay(paymentRequest);
      } catch (error) {
        alert(`Payment error: ${error instanceof Error ? error.message : String(error)}`);
        walletBtn.disabled = false;
        walletBtn.textContent = 'Connect Wallet & Pay';
      }
    });

    modal.appendChild(closeBtn);
    modal.appendChild(title);
    modal.appendChild(amount);
    modal.appendChild(qrContainer);
    modal.appendChild(instructions);
    modal.appendChild(walletBtn);
    overlay.appendChild(modal);

    document.body.appendChild(overlay);
    this.modal = overlay;

    // Generate QR code
    try {
      const qr = await this.widget.generateQR(paymentRequest);
      qrContainer.innerHTML = qr;
    } catch (error) {
      qrContainer.innerHTML = `<p style="color: red;">Failed to generate QR code: ${error instanceof Error ? error.message : String(error)}</p>`;
    }

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hideModal();
      }
    });
  }

  /**
   * Hide payment modal
   */
  hideModal(): void {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }

  /**
   * Handle payment flow
   */
  private async handlePayment(paymentConfig: PaymentRequestConfig): Promise<void> {
    try {
      const paymentRequest = await this.widget.requestPayment(paymentConfig);
      await this.showModal(paymentRequest);
    } catch (error) {
      alert(`Failed to create payment request: ${error instanceof Error ? error.message : String(error)}`);
      this.config.onPaymentError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Destroy widget
   */
  destroy(): void {
    this.hideModal();
    this.widget.destroy();
    this.container.innerHTML = '';
  }
}

