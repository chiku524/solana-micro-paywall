# Buyer Discovery & Content Access Improvements

## Current State Analysis

### Current Methods for Merchants to Attract Buyers:
1. **Widget Embedding** - Merchants embed payment widget on their own site/app
2. **Public Marketplace** - Content discovery through `/marketplace` and `/marketplace/discover`

### Current Buyer Access Methods:
1. **Purchase via Widget** - Buyers purchase on merchant's site → access token stored in `localStorage`
2. **Purchase via Marketplace** - Buyers purchase through marketplace → access token stored in `localStorage`
3. **Token Storage Format**: `access_${merchantId}_${slug}` in browser localStorage

### Current Issues:
- ❌ No "My Purchases" or "My Library" page for buyers
- ❌ Access tokens only in localStorage (lost if browser data cleared)
- ❌ No cross-device access (tokens are device-specific)
- ❌ Limited discovery options (only marketplace)
- ❌ No purchase history or purchase management
- ❌ No way to see what content you've purchased
- ❌ No shareable purchase links
- ❌ No merchant profile pages for better discovery
- ❌ No content recommendations based on purchases
- ❌ No social sharing features

---

## Implemented Improvements

### ✅ 1. My Library Page (`/library`)
**Status**: Implemented

**Features**:
- View all purchased content in one place
- Search purchased content
- Filter by active/expired status
- See expiration dates for time-limited access
- Direct links to access purchased content
- Empty state with CTA to browse marketplace

**Location**: `apps/web/app/library/page.tsx`

**Navigation**: Added to marketplace header and landing page footer

---

## Recommended Future Improvements

### 2. Wallet-Linked Purchases (High Priority)
**Problem**: Current system stores tokens in localStorage, which is device-specific and can be lost.

**Solution**: Link purchases to wallet address on backend
- Store purchase records linked to `payerWallet` address
- Create API endpoint: `GET /api/purchases?walletAddress={address}`
- Allow buyers to view purchases from any device by connecting wallet
- Migrate existing localStorage tokens to wallet-linked system

**Benefits**:
- ✅ Cross-device access
- ✅ Persistent purchase history
- ✅ No data loss if browser cleared
- ✅ Better user experience

**Implementation**:
```typescript
// Backend: Add Purchase model linked to wallet
model Purchase {
  id          String   @id @default(cuid())
  walletAddress String  // Buyer's wallet address
  paymentId   String @unique
  contentId    String
  merchantId   String
  purchasedAt  DateTime @default(now())
  expiresAt    DateTime?
  accessToken  String
  
  @@index([walletAddress])
  @@index([contentId])
}

// API Endpoint
GET /api/purchases?walletAddress={address}
```

### 3. Shareable Purchase Links
**Problem**: Buyers can't easily share or bookmark purchased content.

**Solution**: Generate shareable links with embedded access tokens
- Create endpoint: `GET /marketplace/content/{merchantId}/{slug}?token={accessToken}`
- Allow merchants to generate shareable purchase links
- Support QR codes for easy mobile access
- Links can be bookmarked and shared

**Benefits**:
- ✅ Easy content sharing
- ✅ Bookmarkable purchases
- ✅ QR code support for mobile
- ✅ Better user experience

### 4. Merchant Profile Pages
**Problem**: Limited discovery - buyers can't easily find all content from a specific merchant.

**Solution**: Create merchant profile pages
- Route: `/marketplace/merchant/{merchantId}`
- Show merchant info, all public content, stats
- Follow/unfollow merchants
- Get notified of new content from followed merchants

**Benefits**:
- ✅ Better content discovery
- ✅ Merchant branding
- ✅ Social features (follow merchants)
- ✅ Notification system for new content

**Implementation**:
```typescript
// Backend: Add merchant profile endpoint
GET /api/discover/merchants/{merchantId}
GET /api/discover/merchants/{merchantId}/contents

// Frontend: Merchant profile page
/app/marketplace/merchant/[merchantId]/page.tsx
```

### 5. Content Recommendations
**Problem**: Buyers don't discover related content easily.

**Solution**: Implement recommendation engine
- Based on purchase history
- Based on category preferences
- Based on similar buyers' purchases
- Show "You might also like" sections

**Benefits**:
- ✅ Increased content discovery
- ✅ Higher conversion rates
- ✅ Better user engagement
- ✅ More sales for merchants

### 6. Social Sharing Features
**Problem**: No way to share content or purchases socially.

**Solution**: Add social sharing
- Share purchased content (with preview)
- Share merchant profiles
- Share marketplace listings
- Social media integration (Twitter, Facebook, etc.)

**Benefits**:
- ✅ Viral growth
- ✅ Free marketing for merchants
- ✅ Increased discovery
- ✅ Community building

### 7. Content Collections/Playlists
**Problem**: Buyers can't organize their purchased content.

**Solution**: Allow buyers to create collections
- Create custom playlists/collections
- Organize content by topic, category, etc.
- Share collections with others
- Merchants can create curated collections

**Benefits**:
- ✅ Better content organization
- ✅ Social features
- ✅ Increased engagement
- ✅ Merchants can create bundles

### 8. Email Notifications (Optional)
**Problem**: Buyers don't know about new content from merchants they've purchased from.

**Solution**: Email notification system
- Notify buyers of new content from merchants they've purchased from
- Weekly digest of new content
- Price drop alerts
- Access expiration reminders

**Benefits**:
- ✅ Re-engagement
- ✅ Increased sales
- ✅ Better user retention
- ✅ Merchant growth

### 9. Purchase History & Receipts
**Problem**: No way to track purchase history or get receipts.

**Solution**: Comprehensive purchase history
- View all purchases with dates
- Download receipts (PDF)
- View transaction details
- Export purchase history

**Benefits**:
- ✅ Better record keeping
- ✅ Tax/accounting support
- ✅ Dispute resolution
- ✅ Professional experience

### 10. Bookmarking/Favorites
**Problem**: Buyers can't save content for later purchase.

**Solution**: Bookmark/favorite system
- Save content to wishlist
- Get notified of price changes
- Organize bookmarks by category
- Share wishlists

**Benefits**:
- ✅ Better user experience
- ✅ Increased conversion (reminders)
- ✅ Price drop notifications
- ✅ Social features

---

## Implementation Priority

### Phase 1 (High Impact, Quick Wins):
1. ✅ **My Library Page** - DONE
2. **Wallet-Linked Purchases** - Link purchases to wallet address
3. **Shareable Purchase Links** - Generate shareable URLs with tokens

### Phase 2 (Discovery Improvements):
4. **Merchant Profile Pages** - Show merchant info and all content
5. **Content Recommendations** - Suggest related content
6. **Bookmarking/Favorites** - Save content for later

### Phase 3 (Social & Engagement):
7. **Social Sharing** - Share content and purchases
8. **Content Collections** - Organize and share collections
9. **Email Notifications** - Re-engage buyers

### Phase 4 (Advanced Features):
10. **Purchase History & Receipts** - Comprehensive purchase management

---

## Technical Considerations

### Database Changes Needed:
```prisma
// Add Purchase model for wallet-linked purchases
model Purchase {
  id            String   @id @default(cuid())
  walletAddress String
  paymentId     String   @unique
  contentId     String
  merchantId    String
  purchasedAt   DateTime @default(now())
  expiresAt     DateTime?
  accessToken   String
  
  content       Content  @relation(fields: [contentId], references: [id])
  merchant      Merchant @relation(fields: [merchantId], references: [id])
  payment       Payment  @relation(fields: [paymentId], references: [id])
  
  @@index([walletAddress])
  @@index([contentId])
  @@index([merchantId])
  @@index([purchasedAt])
}

// Add Bookmark model
model Bookmark {
  id          String   @id @default(cuid())
  walletAddress String
  contentId    String
  createdAt    DateTime @default(now())
  
  content     Content  @relation(fields: [contentId], references: [id])
  
  @@unique([walletAddress, contentId])
  @@index([walletAddress])
}

// Add MerchantFollow model
model MerchantFollow {
  id            String   @id @default(cuid())
  walletAddress String
  merchantId    String
  createdAt      DateTime @default(now())
  
  merchant      Merchant @relation(fields: [merchantId], references: [id])
  
  @@unique([walletAddress, merchantId])
  @@index([walletAddress])
}
```

### API Endpoints Needed:
```
GET    /api/purchases?walletAddress={address}
GET    /api/purchases/{id}
GET    /api/discover/merchants/{merchantId}
GET    /api/discover/merchants/{merchantId}/contents
GET    /api/recommendations?walletAddress={address}
POST   /api/bookmarks
DELETE /api/bookmarks/{id}
GET    /api/bookmarks?walletAddress={address}
POST   /api/merchants/{id}/follow
DELETE /api/merchants/{id}/follow
```

---

## User Experience Flow

### Current Flow:
1. Buyer discovers content (marketplace or merchant site)
2. Buyer purchases content
3. Access token stored in localStorage
4. Buyer accesses content (if they remember the URL)

### Improved Flow:
1. Buyer discovers content (marketplace, merchant profile, recommendations, social shares)
2. Buyer can bookmark content for later
3. Buyer purchases content
4. Purchase linked to wallet address
5. Buyer can access from any device via "My Library"
6. Buyer gets recommendations for similar content
7. Buyer can share purchased content
8. Buyer gets notified of new content from followed merchants

---

## Success Metrics

- **Discovery**: Increase in content views from non-marketplace sources
- **Engagement**: Time spent on platform, repeat purchases
- **Conversion**: Purchase rate from bookmarks/recommendations
- **Retention**: Return rate of buyers
- **Social**: Number of shares, viral coefficient
- **Merchant Growth**: Increase in merchant signups and content creation

---

## Next Steps

1. ✅ Implement My Library page (DONE)
2. Implement wallet-linked purchases (Phase 1)
3. Add shareable purchase links (Phase 1)
4. Create merchant profile pages (Phase 2)
5. Implement recommendation engine (Phase 2)
6. Add bookmarking system (Phase 2)

