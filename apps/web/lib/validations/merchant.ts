import { z } from 'zod';

export const merchantLoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  payoutAddress: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length >= 32,
      'Please enter a valid Solana wallet address'
    ),
});

export const merchantIdSchema = z.object({
  merchantId: z
    .string()
    .min(1, 'Merchant ID is required')
    .uuid('Please enter a valid merchant ID'),
});

export type MerchantLoginFormData = z.infer<typeof merchantLoginSchema>;
export type MerchantIdFormData = z.infer<typeof merchantIdSchema>;

