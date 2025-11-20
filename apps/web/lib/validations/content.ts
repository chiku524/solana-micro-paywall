import { z } from 'zod';

export const contentSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .max(100, 'Slug must be less than 100 characters'),
  priceLamports: z
    .string()
    .min(1, 'Price is required')
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      'Please enter a valid price greater than 0'
    ),
  currency: z.enum(['SOL', 'USDC', 'PYUSD'], {
    errorMap: () => ({ message: 'Please select a valid currency' }),
  }),
  durationSecs: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(parseInt(val)) && parseInt(val) > 0),
      'Duration must be a positive number'
    ),
});

export type ContentFormData = z.infer<typeof contentSchema>;

