# 🛒 VendToCust

**A real-time vendor marketplace platform that connects local shops with nearby customers.**

Customers can discover stores in their area, browse live inventory, add items to a cart, and checkout — all with real-time stock validation. Vendors get a full dashboard to manage their store profile, location, and inventory.

---

## ✨ Features

### For Customers
- **Location-Based Store Discovery** — Find nearby stores using GPS geolocation or manual address/pincode search (powered by OpenStreetMap Nominatim geocoding).
- **Live Inventory Browsing** — View each store's product catalog with real-time stock availability.
- **Shopping Cart** — Add items from any store, adjust quantities, and review orders in a slide-out cart drawer.
- **Secure Checkout** — Transaction-based checkout using Firebase `runTransaction` to atomically decrement stock and prevent overselling.

### For Vendors
- **Google Authentication** — One-click vendor login via Google (Firebase Auth with popup sign-in).
- **Store Profile Setup** — Create a store with name, description, and location. Supports auto-detection via browser geolocation with reverse geocoding, or manual address entry with forward geocoding.
- **Real-Time Inventory Management** — Add products (name, price, stock), increment/decrement stock levels, and delete items. All changes sync instantly via Firebase Realtime Database listeners.

### General
- **Dark / Light Theme Toggle** — System-preference-aware theming with manual override, persisted to `localStorage`.
- **Global Error Handling** — Auto-dismissing toast notifications via a dedicated `ErrorContext`, plus a class-based `ErrorBoundary` for uncaught render errors.
- **Protected Routes** — Vendor dashboard is gated behind authentication; unauthenticated users are redirected to login.
- **Responsive Design** — Mobile-first layout built with Tailwind CSS v4.

---

## 🛠 Tech Stack

| Layer          | Technology                                                  |
| -------------- | ----------------------------------------------------------- |
| **Framework**  | [React 19](https://react.dev/) with JSX                     |
| **Routing**    | [React Router v7](https://reactrouter.com/)                 |
| **Styling**    | [Tailwind CSS v4](https://tailwindcss.com/)                 |
| **Build Tool** | [Vite 8](https://vitejs.dev/)                               |
| **Backend**    | [Firebase](https://firebase.google.com/) (Auth + Realtime Database) |
| **Geocoding**  | [OpenStreetMap Nominatim API](https://nominatim.openstreetmap.org/) |
| **Linting**    | [ESLint 9](https://eslint.org/) with React Hooks plugin     |

---

## 📁 Project Structure

```
webdev project/
├── public/                    # Static assets
├── src/
│   ├── assets/                # Images, icons, etc.
│   ├── components/
│   │   ├── CartModal.jsx      # Slide-out cart drawer with checkout
│   │   ├── ErrorBoundary.jsx  # Class-based error boundary (catches render crashes)
│   │   └── ProtectedRoute.jsx # Auth guard — redirects to /login if unauthenticated
│   ├── context/
│   │   ├── AuthContext.jsx    # Firebase Auth state (Google sign-in, logout, onAuthStateChanged)
│   │   ├── CartContext.jsx    # Cart state management (add, remove, update quantity, clear)
│   │   ├── ErrorContext.jsx   # Global error toast system (auto-dismiss after 5s)
│   │   └── ThemeContext.jsx   # Dark/light theme with localStorage persistence
│   ├── pages/
│   │   ├── Home.jsx           # Landing page with store discovery & location search
│   │   ├── Login.jsx          # Google OAuth login page for vendors
│   │   ├── StoreView.jsx      # Individual store page (customer-facing product catalog)
│   │   └── VendorDashboard.jsx# Vendor dashboard (profile setup + inventory CRUD)
│   ├── services/
│   │   └── firebase.js        # Firebase app initialization (Auth, Realtime DB)
│   ├── App.jsx                # Root component (routing, context providers, theme toggle)
│   ├── App.css                # App-level styles
│   ├── index.css              # Global base styles
│   └── main.jsx               # Entry point (renders App)
├── .env.local                 # Firebase environment variables (not committed)
├── index.html                 # HTML shell
├── package.json
├── vite.config.js
└── eslint.config.js
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A **Firebase project** with:
  - Authentication (Google sign-in provider enabled)
  - Realtime Database created

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/vend-to-cust.git
cd vend-to-cust
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
```

### 4. Start the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (default Vite port).

### 5. Build for Production

```bash
npm run build
npm run preview   # Preview the production build locally
```

---

## 🗄️ Firebase Database Structure

```
├── stores/
│   └── {userId}/
│       ├── name: string
│       ├── description: string
│       ├── address: string
│       ├── lat: number
│       ├── lon: number
│       └── createdAt: string (ISO timestamp)
│
└── inventory/
    └── {userId}/
        └── {itemId}/
            ├── name: string
            ├── price: number
            └── stock: number
```

---

## 🔑 Routes

| Path                 | Access    | Description                                 |
| -------------------- | --------- | ------------------------------------------- |
| `/`                  | Public    | Home — store discovery with location search |
| `/login`             | Public    | Google OAuth login for vendors               |
| `/store/:storeId`    | Public    | Individual store view (product catalog)      |
| `/vendor/dashboard`  | Protected | Vendor dashboard (profile + inventory CRUD)  |

---

## 📜 Available Scripts

| Command            | Description                        |
| ------------------ | ---------------------------------- |
| `npm run dev`      | Start Vite dev server with HMR     |
| `npm run build`    | Build optimized production bundle  |
| `npm run preview`  | Preview the production build       |
| `npm run lint`     | Run ESLint across the project      |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
