import { z } from 'zod';

export const settingsSchema = z.object({
  payoutAddress: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length >= 32,
      'Please enter a valid Solana wallet address'
    ),
  status: z.enum(['pending', 'active', 'suspended', 'kyc_required'], {
    errorMap: () => ({ message: 'Please select a valid status' }),
  }),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;

