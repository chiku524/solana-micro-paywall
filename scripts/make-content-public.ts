/**
 * Helper script to make content public and add discovery metadata
 * Usage: npx tsx scripts/make-content-public.ts <contentId> [options]
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

interface UpdateContentOptions {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  visibility?: 'public' | 'private' | 'unlisted';
  previewText?: string;
  thumbnailUrl?: string;
}

async function makeContentPublic(
  contentId: string,
  options: UpdateContentOptions = {},
) {
  try {
    const updateData: UpdateContentOptions = {
      visibility: 'public',
      ...options,
    };

    console.log(`Updating content ${contentId}...`);
    const response = await axios.put(`${API_URL}/contents/${contentId}`, updateData);

    console.log('✅ Content updated successfully!');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('❌ Failed to update content:', error.response?.data || error.message);
    process.exit(1);
  }
}

// CLI usage
if (require.main === module) {
  const contentId = process.argv[2];
  if (!contentId) {
    console.error('Usage: npx tsx scripts/make-content-public.ts <contentId> [title] [description] [category]');
    process.exit(1);
  }

  const options: UpdateContentOptions = {};
  if (process.argv[3]) options.title = process.argv[3];
  if (process.argv[4]) options.description = process.argv[4];
  if (process.argv[5]) options.category = process.argv[5];
  if (process.argv[6]) options.tags = process.argv[6].split(',');

  makeContentPublic(contentId, options);
}

export { makeContentPublic };


