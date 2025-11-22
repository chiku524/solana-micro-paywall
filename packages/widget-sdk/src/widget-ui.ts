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
   * Render payment button with customization
   */
  renderButton(paymentConfig: PaymentRequestConfig): void {
    const button = document.createElement('button');
    button.className = this.config.buttonClass || 'solana-pay-button';
    
    // Get customization values
    const colors = this.config.colors || {};
    const primaryColor = colors.primary || '#10b981'; // Default emerald
    const primaryHover = colors.primaryHover || colors.primary || '#059669';
    const textColor = colors.text || '#ffffff';
    const borderRadius = this.config.borderRadius || 8;
    const fontFamily = this.config.fontFamily || 'inherit';
    const ctaText = this.config.ctaText || this.config.buttonText || 'Pay with Solana';
    
    button.textContent = ctaText;
    
    // Apply custom styles
    button.style.cssText = `
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 600;
      border: none;
      border-radius: ${borderRadius}px;
      background: ${primaryColor};
      color: ${textColor};
      font-family: ${fontFamily};
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s, background-color 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    `;

    // Add logo if configured
    if (this.config.logo?.url) {
      const logo = document.createElement('img');
      logo.src = this.config.logo.url;
      logo.alt = this.config.logo.alt || 'Logo';
      logo.style.cssText = `
        width: ${this.config.logo.width || 20}px;
        height: ${this.config.logo.height || this.config.logo.width || 20}px;
        object-fit: contain;
      `;
      button.insertBefore(logo, button.firstChild);
    }

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.background = primaryHover;
      button.style.boxShadow = `0 4px 12px ${primaryColor}40`;
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.background = primaryColor;
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

    // Create modal content with customization
    const colors = this.config.colors || {};
    const backgroundColor = colors.background || '#ffffff';
    const textColor = colors.text || '#000000';
    const borderRadius = this.config.borderRadius || 16;
    const fontFamily = this.config.fontFamily || 'inherit';
    
    const modal = document.createElement('div');
    modal.className = 'solana-pay-modal';
    modal.style.cssText = `
      background: ${backgroundColor};
      color: ${textColor};
      border-radius: ${borderRadius}px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      position: relative;
      font-family: ${fontFamily};
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

    // Amount display (only if showPrice is not false)
    let amount: HTMLElement | null = null;
    if (this.config.showPrice !== false) {
      amount = document.createElement('div');
      const amountInSol = (Number(paymentRequest.amount) / 1e9).toFixed(4);
      amount.textContent = `${amountInSol} ${paymentRequest.currency}`;
      const primaryColor = colors.primary || '#10b981';
      amount.style.cssText = `
        text-align: center;
        font-size: 24px;
        font-weight: 600;
        margin: 16px 0;
        color: ${primaryColor};
      `;
    }

    // Instructions
    const instructions = document.createElement('p');
    instructions.textContent = 'Scan QR code with your Solana wallet or click "Connect Wallet" below';
    instructions.style.cssText = `
      text-align: center;
      color: #666;
      font-size: 14px;
      margin: 16px 0;
    `;

    // Wallet button with customization
    const walletBtn = document.createElement('button');
    const ctaText = this.config.ctaText || 'Connect Wallet & Pay';
    walletBtn.textContent = ctaText;
    const primaryColor = colors.primary || '#10b981';
    const primaryHover = colors.primaryHover || colors.primary || '#059669';
    walletBtn.style.cssText = `
      width: 100%;
      padding: 12px;
      font-size: 16px;
      font-weight: 600;
      border: none;
      border-radius: ${borderRadius}px;
      background: ${primaryColor};
      color: ${textColor};
      cursor: pointer;
      margin-top: 16px;
      transition: background-color 0.2s;
    `;
    walletBtn.addEventListener('mouseenter', () => {
      walletBtn.style.background = primaryHover;
    });
    walletBtn.addEventListener('mouseleave', () => {
      walletBtn.style.background = primaryColor;
    });
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
    if (amount) modal.appendChild(amount);
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

