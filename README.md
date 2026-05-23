# 🚀 Scrapvex Backend API
The core backend architecture for Scrapvex - A premium, multi-role scrap marketplace and end-to-end operational ERP system. Built with Node.js, Express, and MongoDB.

## 🌟 Key Features
- **Multi-Role Authentication**: Secure JWT-based access for `Admin`, `Franchise`, `Collector`, and `User`.
- **Vyapar ERP Module**: Fully integrated B2B billing system tracking Purchases (Suppliers), Sales/Invoices (Buyers), and real-time Inventory Stock.
- **Dynamic Routing & Operations**: Scrap pickup scheduling, collector assignment, and status tracking.
- **Financial Ledger**: Integrated digital Wallet system, balance ledgers, and withdrawal requests for collectors/users.
- **Customer Relationship Management**: Support ticketing system with chat-bubble replies, review management, and global push notifications/broadcasts.
- **District Franchise Control**: Advanced geo-fencing mechanics allowing city-specific scrap rates and customized district-level operational settings.

## 🛠️ Technology Stack
- **Framework**: Node.js & Express.js
- **Database**: MongoDB (Mongoose ORM)
- **Security**: bcryptjs (Password Hashing), jsonwebtoken (Auth)
- **File Uploads**: multer

## 📂 Core Architecture (Mongoose Models)
- `User`: Centralized user store (Handles Admin, Franchise, Collector, Customer).
- `Pickup`, `ScrapItem`, `CityRate`: Operations & Material Configuration.
- `Purchase`, `Sale`, `Inventory`, `Supplier`, `Buyer`: Complete B2B Billing ERP.
- `WalletTransaction`, `WithdrawalRequest`: Payout logic.
- `SupportTicket`, `Notification`, `Broadcast`: Engagement modules.

## 🚀 Running Locally
1. Clone the repository and navigate to the backend directory.
2. Run `npm install` to install dependencies.
3. Create a `.env` file with `MONGO_URI`, `PORT=5000`, and `JWT_SECRET`.
4. Run `npm run dev` to start the server in development mode.
