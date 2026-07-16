# Finova ⚡

Finova is a premium, state-of-the-art Personal Finance Dashboard built with React, Vite, and Chart.js. It features a sleek Apple-inspired glassmorphism user interface, supporting comprehensive financial planning, investment tracking, and budgeting.

## Key Features

- **Overview (Dashboard)**: Track Net Worth, Monthly Expenses, Portfolio Returns, Savings Rate. Visual charts for Net Worth trend and Monthly Spend vs average.
- **Multi-Currency & Real-Time Exchange Rates**: Instantly switch display currencies between **USD ($)**, **EUR (€)**, and **INR (₹)**. Fetch real-time exchange rates via a public API.
- **Expenses (Expense Tracker)**: Add, edit, or delete expenses. Filter by category, view category breakdowns with Doughnut charts, set monthly budgets with a visual progress bar, and import/export data via CSV.
- **Portfolio (Investment Tracker)**: Track holdings across Stocks, Mutual Funds, Crypto, Gold, Real Estate, and Fixed Deposits. Track capital invested, current valuations, Net P&L, ROI, and update values on-the-fly.
- **EMI Calculator**: Calculate monthly loan repayments, interest rates, and loan tenures. Visualizes principal vs interest and outstanding balance decay over time with a yearly amortization schedule.
- **SIP Calculator**: Calculate wealth growth via Systematic Investment Plans. Visualizes total capital invested vs wealth gains, and compound growth trajectory.
- **Theme Support**: Seamless toggling between Light and Dark mode.
- **PWA Ready**: Offline-capable, add to home screen banner (service worker).

---

## Tech Stack

- **Core**: React 18, Vite
- **Styling**: Custom CSS (Vanilla CSS) with CSS Variables for theme sync
- **Icons**: Lucide React
- **Charts**: Chart.js, React-Chartjs-2
- **Data Persistence**: LocalStorage

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Vinamra-Mishra/Finova.git
   cd Finova
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

---

## Directory Structure

```text
├── public/                  # PWA Manifest, Icons, and Service Worker
├── src/
│   ├── assets/              # Static assets (images, logos)
│   ├── components/
│   │   ├── Dashboard.jsx    # Overview tab layout & charts
│   │   ├── EmiCalculator.jsx# Loan calculation tool & amortization
│   │   ├── ExpenseTracker.jsx# Spend tracking, CSV actions, and budget limit
│   │   ├── InvestmentTracker.jsx # Asset logging, ROI, and quick updates
│   │   ├── Sidebar.jsx      # Navigation, theme toggle, and currency controls
│   │   └── SipCalculator.jsx# Investment calculator & compound growth chart
│   ├── utils/
│   │   ├── chartUtils.js    # Canvas gradients, tooltips, and doughnut center labels
│   │   ├── csv.js           # CSV parser and exporter
│   │   ├── currency.js      # Currency formatter & Exchange Rate API client
│   │   └── storage.js       # LocalStorage handlers for state persistence
│   ├── App.css              # App-specific layout rules
│   ├── App.jsx              # Main container, routing, and global state (currency, theme)
│   ├── index.css            # Root styles and CSS theme configurations
│   └── main.jsx             # Entry point
```

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
