// Main exports
export { PaymentWidget } from './payment-widget.js';
export { PaymentWidgetUI } from './widget-ui.js';
export { ApiClient } from './api-client.js';
export { SolanaPaywallWidget } from './react-widget.jsx';

// Types
export type {
  PaymentRequestConfig,
  PaymentRequestResponse,
  PaymentStatus,
  VerifyPaymentResponse,
  WidgetConfig,
  PaymentEvent,
} from './types.js';

export type { WidgetUIOptions } from './widget-ui.js';
export type { ReactWidgetProps } from './react-widget.jsx';

// Import for convenience function
import type { WidgetUIOptions } from './widget-ui.js';
import { PaymentWidgetUI } from './widget-ui.js';

// Convenience function for quick setup
export function createPaymentWidget(options: WidgetUIOptions) {
  return new PaymentWidgetUI(options);
}
