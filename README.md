# Al Noor Specialist Hospital, Battagram - Hospital Management System (HMS)
### KP-HCC MSDS Category 2-B Certified Health Informatics System

A full-stack, production-grade Hospital Management System (HMS) architected for **Al Noor Specialist Hospital, Battagram**, fully compliant with Khyber Pakhtunkhwa Health Care Commission (KP-HCC) Minimum Service Delivery Standards (MSDS) Category 2-B.

---

## 🏥 Architecture Overview

- **Architecture:** Yarn Workspaces Monorepo
- **Backend:** Node.js, Express.js (Modular Feature Architecture: `controller`, `service`, `routes`)
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React
- **Database:** Local MySQL (InnoDB ACID Compliant) with 29 Relational Tables & Foreign Keys
- **Session Management:** Persistent DB Sessions stored in `user_sessions` with role-scoped JWT tokens
- **Shift Modes:** Clinical Day Shift (Light) & Diagnostic Night Shift (Dark)

---

## 🗂️ Monorepo Structure

```
Alnoor_HMS/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection pool (mysql2/promise)
│   │   ├── middleware/      # Auth & role-based access control
│   │   ├── modules/         # Modular feature endpoints
│   │   │   ├── auth/        # Persistent sessions & authentication
│   │   │   ├── opd/         # Rapid OPD registration & tokens
│   │   │   ├── doctor/      # CPOE, Order sets & prescriptions
│   │   │   ├── pharmacy/    # FEFO POS & LASA alert banner
│   │   │   ├── lims/        # 16-parameter CBC analyzer & QR verification
│   │   │   ├── ipd/         # Interactive Bed Matrix & wristbands
│   │   │   ├── emar/        # Bedside 5-Rights scanner & fridge log
│   │   │   ├── ot/          # WHO surgical checklist & instrument count
│   │   │   ├── billing/     # Consolidated invoicing & cash drawer
│   │   │   └── audit/       # KP-HCC Category 2-B 122 indicator governance
│   │   └── server.js        # Express application entrypoint
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Sidebar, Navbar, WristbandModal, ThermalSlipModal
│   │   ├── context/         # AuthContext & ThemeContext
│   │   ├── modules/         # Feature views (pages & APIs)
│   │   ├── services/        # Axios API client
│   │   ├── App.jsx          # Collapsible workstation shell
│   │   ├── main.jsx
│   │   └── index.css        # Clinical Tailwind design system
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── schema.sql               # Full 29-table DDL schema
├── test-connection.js       # Database diagnostics & table verification
├── test-e2e-workflow.js     # Automated 10-phase clinical workflow test
├── package.json             # Root monorepo scripts
└── .env.example             # Environment variable template
```

---

## 👥 Role-Based Access Control (8 Staff Roles)

All accounts are pre-seeded with bcrypt-hashed credentials (`Admin@123`):

| Role | Username | Full Name | Department / Station |
|---|---|---|---|
| `RECEPTIONIST` | `reception1` | Ali Khan | Front Desk / OPD Rapid Intake |
| `DOCTOR` | `dr_tariq` | Dr. Tariq Shah | General OPD / Surgical Consultations |
| `PHARMACIST` | `ph_zubair` | Zubair Ahmed | Main Central Pharmacy & POS |
| `LAB_TECH` | `lab_hamza` | Hamza Noor | Diagnostic Pathology & LIMS |
| `NURSE` | `nurse_sobia` | Sobia Bibi | Inpatient Ward / Bedside e-MAR |
| `SURGEON` | `dr_bilal` | Dr. Bilal Akhtar | Operating Theatre & Laparoscopy |
| `BILLING_CASHIER` | `cashier_usman` | Usman Qazi | Central Revenue & Cash Drawers |
| `COMPLIANCE_ADMIN`| `admin_director` | Medical Director | Quality Assurance & KP-HCC Audits |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+ recommended)
- Yarn package manager (`npm install -g yarn`)
- MySQL Server 8.0+ running on `localhost:3306`

### 2. Environment Configuration
Copy `.env.example` to `.env` in the repository root:
```bash
cp .env.example .env
```
Ensure your MySQL credentials match `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hospital_management
DB_PORT=3306
JWT_SECRET=alnoor_secret_key_msds_2026
PORT=5000
```

### 3. Database Initialization
Import the database schema:
```bash
mysql -u root -p hospital_management < schema.sql
```

### 4. Install Dependencies
```bash
yarn install
```

### 5. Run Database & Workflow Diagnostics
```bash
# Verify connection to all 29 tables
node test-connection.js

# Run full 10-phase automated clinical workflow test
node test-e2e-workflow.js
```

### 6. Start the Hospital System
```bash
yarn dev
```
- **Backend API:** `http://localhost:5000`
- **Frontend SPA:** `http://localhost:5173`

---

## 📋 KP-HCC MSDS Category 2-B Compliance Features

1. **Patient Identification & Safety:** 250x30mm thermal barcoded wristbands with patient MRN and admission tracking.
2. **5-Rights Bedside Medication Administration:** Real-time barcode validation ensuring Right Patient, Right Drug, Right Dose, Right Route, and Right Time.
3. **High-Alert & LASA Medications:** Visual Look-Alike Sound-Alike warning banners with FEFO (First-Expired, First-Out) inventory auto-selection.
4. **WHO Surgical Safety Checklist:** Mandatory digital Sign-In, Time-Out, and Sign-Out gateways with sponge/instrument reconciliation.
5. **Cold Chain Management:** Twice-daily digital logging for medication and vaccine storage fridges (2°C - 8°C).
6. **Unified Central Invoicing:** Itemized consolidated billing linking OPD, IPD bed stays, pharmacy items, lab diagnostics, and OT procedures.
7. **Cash Drawer Reconciliation:** Mandatory shift-end physical cash count balancing against system-billed revenue.
8. **Clinical Governance:** Real-time compliance scoring across 122 Category 2-B indicators and biomedical asset calibration schedules.

---

## 📄 License
Proprietary health informatics software developed for Al Noor Specialist Hospital, Battagram.

