# java-programming

## PharmaCare — Team 1

Premium React/Vite UI for the Pharmacy Inventory and Billing Management System.

## What changed
- Production-style SaaS layout with responsive sidebar and mobile navigation drawer.
- Collapsible desktop sidebar with persistent preference.
- Light/dark theme with persistent preference.
- Global medicine search with keyboard shortcut (⌘/Ctrl + K).
- Notification center for low-stock and expired medicines.
- Redesigned dashboard, inventory, billing, and sales pages.
- Responsive tables, cards, forms, modals, receipts, and mobile layouts.
- Skeleton loading states, empty states, validation feedback, toast notifications, disabled processing states, and subtle micro-interactions.
- Improved focus states and semantic buttons/labels.
- No API endpoints, Java business logic, collection requirements, or database structure were changed.

## Run
Terminal 1:
```bash
javac PharmacyServer.java
java PharmacyServer
```

Terminal 2:
```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

The React dev server proxies `/api` requests to the Java server at `localhost:8080`.

## Login
The React app now opens with a login screen. Demo credentials:

- Username: `admin`
- Password: `admin123`

The login session is stored locally in browser localStorage. This is a frontend application login and does not modify the Java API or database structure.

## Billing flow
After **Generate bill** succeeds, the app stays on the Billing page and renders the generated customer receipt in the Bill Preview panel. Sales Records is refreshed in the background but is not opened automatically. The receipt also has **Print / Save** and **New bill** actions.

## Login background — LineWaves

The login screen uses a lightweight JS/CSS LineWaves background adapted for this Vite + React + plain CSS project.

React Bits installation command:

```bash
npx shadcn@latest add @react-bits/LineWaves-JS-CSS
```

The current project keeps the login animation dependency-light and does not require WebGL/OGL just for the authentication screen.
