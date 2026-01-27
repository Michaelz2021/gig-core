# src/modules Directory Tree Structure

Created: 2025-11-29

## Complete Module Structure

```
src/modules/
├── auth/                          # Authentication module
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── dto/
│   │   ├── login.dto.ts
│   │   ├── logout.dto.ts
│   │   ├── refresh-token.dto.ts
│   │   ├── register.dto.ts
│   │   └── verify-otp.dto.ts
│   └── strategies/
│       └── jwt.strategy.ts
│
├── users/                         # User module
│   ├── users.controller.ts
│   ├── users.module.ts
│   ├── users.service.ts
│   ├── dto/
│   │   ├── get-providers.dto.ts
│   │   └── update-user.dto.ts
│   └── entities/
│       ├── provider-favorite.entity.ts
│       ├── provider.entity.ts
│       ├── user-profile.entity.ts
│       └── user.entity.ts
│
├── services/                      # Service module
│   ├── services.controller.ts
│   ├── services.module.ts
│   ├── services.service.ts
│   ├── dto/
│   │   ├── create-service-category.dto.ts
│   │   ├── create-service.dto.ts
│   │   └── search-service.dto.ts
│   └── entities/
│       ├── service-category.entity.ts
│       └── service.entity.ts
│
├── bookings/                      # Booking/Contract module
│   ├── bookings.controller.ts
│   ├── bookings.module.ts
│   ├── bookings.service.ts
│   ├── dto/
│   │   ├── create-booking.dto.ts
│   │   ├── create-smart-contract.dto.ts
│   │   ├── sign-contract.dto.ts
│   │   └── update-booking-status.dto.ts
│   └── entities/
│       ├── booking.entity.ts
│       └── smart-contract.entity.ts
│
├── payments/                      # Payment module
│   ├── payments.controller.ts
│   ├── payments.module.ts
│   ├── payments.service.ts
│   ├── dto/
│   │   ├── get-payment-methods.dto.ts
│   │   ├── process-payment.dto.ts
│   │   └── wallet-topup.dto.ts
│   └── entities/
│       ├── escrow.entity.ts
│       ├── payment.entity.ts
│       ├── reward-credit-transaction.entity.ts
│       ├── transaction.entity.ts
│       ├── wallet-transaction.entity.ts
│       └── wallet.entity.ts
│
├── reviews/                      # Review module
│   ├── reviews.controller.ts
│   ├── reviews.module.ts
│   ├── reviews.service.ts
│   ├── dto/
│   │   └── create-review.dto.ts
│   └── entities/
│       └── review.entity.ts
│
├── matching/                     # Matching/Auction module
│   ├── matching.controller.ts
│   ├── matching.module.ts
│   ├── matching.service.ts
│   ├── dto/
│   │   ├── add-message-to-session.dto.ts
│   │   ├── create-auction-bid.dto.ts
│   │   ├── create-auction.dto.ts
│   │   └── create-quotation-session.dto.ts
│   └── entities/
│       ├── ai-quotation-session.entity.ts
│       ├── auction-bid.entity.ts
│       └── auction.entity.ts
│
├── trust-score/                  # Trust Score module
│   ├── trust-score.controller.ts
│   ├── trust-score.module.ts
│   ├── trust-score.service.ts
│   ├── dto/
│   │   └── update-trust-score.dto.ts
│   └── entities/
│       ├── trust-score-history.entity.ts
│       └── trust-score.entity.ts
│
├── notifications/               # Notification module
│   ├── notifications.controller.ts
│   ├── notifications.module.ts
│   ├── notifications.service.ts
│   └── entities/
│       └── notification.entity.ts
│
├── messages/                     # Message/Chat module
│   ├── messages.controller.ts
│   ├── messages.module.ts
│   ├── messages.service.ts
│   ├── entities/
│   │   ├── chat-room.entity.ts
│   │   └── message.entity.ts
│   └── gateways/
│       └── chat.gateway.ts
│
├── disputes/                     # Dispute module
│   ├── disputes.controller.ts
│   ├── disputes.module.ts
│   ├── disputes.service.ts
│   ├── dto/
│   │   └── create-dispute.dto.ts
│   └── entities/
│       └── dispute.entity.ts
│
├── health/                       # Health check module
│   ├── health.controller.ts
│   └── health.module.ts
│
├── categories/                   # Category module
│   ├── categories.controller.ts
│   ├── categories.module.ts
│   └── categories.service.ts
│
├── quotes/                       # Quote module
│   ├── quotes.controller.ts
│   ├── quotes.module.ts
│   ├── quotes.service.ts
│   ├── rfq.controller.ts
│   ├── rfq.service.ts
│   ├── dto/
│   │   ├── create-quote.dto.ts
│   │   ├── create-rfq.dto.ts
│   │   └── respond-quote.dto.ts
│   └── entities/
│       ├── quote.entity.ts
│       └── rfq.entity.ts
│
├── upload/                       # File upload module
│   ├── upload.controller.ts
│   ├── upload.module.ts
│   ├── upload.service.ts
│   └── s3.service.ts
│
├── search/                       # Search module
│   ├── search.controller.ts
│   ├── search.module.ts
│   └── search.service.ts
│
└── webhooks/                     # Webhook module
    ├── webhooks.controller.ts
    ├── webhooks.module.ts
    └── webhooks.service.ts
```

---

## Module Details

### 1. auth (Authentication Module)
- **Functionality**: User authentication, registration, login, OTP verification
- **File Count**: 9 files
- **Key Files**:
  - `auth.controller.ts`: Authentication endpoints
  - `auth.service.ts`: Authentication business logic
  - `strategies/jwt.strategy.ts`: JWT strategy

### 2. users (User Module)
- **Functionality**: User management, provider management
- **File Count**: 8 files
- **Key Entities**:
  - `user.entity.ts`: User basic information
  - `user-profile.entity.ts`: User profile
  - `provider.entity.ts`: Provider information
  - `provider-favorite.entity.ts`: Provider favorites

### 3. services (Service Module)
- **Functionality**: Service and category management
- **File Count**: 8 files
- **Key Entities**:
  - `service.entity.ts`: Service information
  - `service-category.entity.ts`: Service category

### 4. bookings (Booking/Contract Module)
- **Functionality**: Booking management, smart contracts
- **File Count**: 9 files
- **Key Entities**:
  - `booking.entity.ts`: Booking information
  - `smart-contract.entity.ts`: Smart contract

### 5. payments (Payment Module)
- **Functionality**: Payment processing, wallet, escrow
- **File Count**: 12 files
- **Key Entities**:
  - `payment.entity.ts`: Payment information
  - `transaction.entity.ts`: Transaction information
  - `wallet.entity.ts`: Wallet information
  - `wallet-transaction.entity.ts`: Wallet transaction
  - `escrow.entity.ts`: Escrow information
  - `reward-credit-transaction.entity.ts`: Reward credit transaction

### 6. reviews (Review Module)
- **Functionality**: Review creation and management
- **File Count**: 5 files
- **Key Entities**:
  - `review.entity.ts`: Review information

### 7. matching (Matching/Auction Module)
- **Functionality**: Auctions, bids, AI quotation sessions
- **File Count**: 10 files
- **Key Entities**:
  - `auction.entity.ts`: Auction information
  - `auction-bid.entity.ts`: Bid information
  - `ai-quotation-session.entity.ts`: AI quotation session

### 8. trust-score (Trust Score Module)
- **Functionality**: Trust score management and history
- **File Count**: 6 files
- **Key Entities**:
  - `trust-score.entity.ts`: Trust score
  - `trust-score-history.entity.ts`: Trust score history

### 9. notifications (Notification Module)
- **Functionality**: Notification management
- **File Count**: 4 files
- **Key Entities**:
  - `notification.entity.ts`: Notification information

### 10. messages (Message/Chat Module)
- **Functionality**: Real-time chat, message management
- **File Count**: 6 files
- **Key Files**:
  - `gateways/chat.gateway.ts`: WebSocket gateway
- **Key Entities**:
  - `message.entity.ts`: Message information
  - `chat-room.entity.ts`: Chat room information

### 11. disputes (Dispute Module)
- **Functionality**: Dispute management
- **File Count**: 5 files
- **Key Entities**:
  - `dispute.entity.ts`: Dispute information

### 12. health (Health Check Module)
- **Functionality**: Server status check
- **File Count**: 2 files
- **Structure**: Only controller and module exist

### 13. categories (Category Module)
- **Functionality**: Category management
- **File Count**: 3 files
- **Structure**: Only controller, service, and module exist

### 14. quotes (Quote Module)
- **Functionality**: Quote and RFQ management
- **File Count**: 9 files
- **Key Files**:
  - `quotes.controller.ts`: Quote controller
  - `rfq.controller.ts`: RFQ controller
- **Key Entities**:
  - `quote.entity.ts`: Quote information
  - `rfq.entity.ts`: RFQ information

### 15. upload (File Upload Module)
- **Functionality**: File upload (S3 integration)
- **File Count**: 4 files
- **Key Files**:
  - `s3.service.ts`: S3 service

### 16. search (Search Module)
- **Functionality**: Search functionality
- **File Count**: 3 files
- **Structure**: Only controller, service, and module exist

### 17. webhooks (Webhook Module)
- **Functionality**: Webhook processing
- **File Count**: 3 files
- **Structure**: Only controller, service, and module exist

---

## Statistics

- **Total Modules**: 17
- **Total Files**: ~108 files
- **Average Files per Module**: ~6.4 files

### Top 5 Modules by File Count
1. **payments**: 12 files
2. **matching**: 10 files
3. **auth**: 9 files
4. **bookings**: 9 files
5. **quotes**: 9 files

### Directory Structure Pattern
Most modules follow this structure:
- `{module}.controller.ts`: REST API endpoints
- `{module}.service.ts`: Business logic
- `{module}.module.ts`: NestJS module definition
- `dto/`: Data Transfer Objects
- `entities/`: TypeORM entities

### Special Structures
- **messages**: Contains `gateways/` directory (WebSocket)
- **auth**: Contains `strategies/` directory (JWT strategy)
- **quotes**: Has two controllers (`quotes.controller.ts`, `rfq.controller.ts`)

---

## File Type Classification

### Controllers (17)
- One controller per module (quotes has 2)

### Services (18)
- One service per module (quotes has 2, upload has 2)

### Modules (17)
- One module file per module

### DTOs (~30)
- Located in each module's `dto/` directory

### Entities (~25)
- Located in each module's `entities/` directory

### Others
- `auth/strategies/jwt.strategy.ts`: JWT strategy
- `messages/gateways/chat.gateway.ts`: WebSocket gateway
- `upload/s3.service.ts`: S3 service

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-29
