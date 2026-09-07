# Family Spending Pattern Analysis 💰

## 📌 About the Project

**Family Spending Pattern Analysis** is a web-based expense tracking system designed to help families manage and understand their daily spending.

Many families exceed their monthly budget because small and unnecessary expenses such as **dining, entertainment, shopping, and subscriptions** are not properly monitored.

This application allows users to record their expenses, set budgets, and analyze their spending patterns through a simple and user-friendly dashboard.

---

## 🎯 Objectives

* Track daily family expenses
* Categorize expenses
* Set monthly budgets
* Monitor spending
* Analyze spending patterns
* Identify unnecessary expenses
* Detect budget overruns
* Help families improve financial planning

---

## ✨ Features

### 🔐 User Authentication

* User Registration
* User Login
* Secure user access

### 💸 Expense Management

* Add expenses
* Edit expenses
* Delete expenses
* View expense history
* Categorize expenses

### 💰 Budget Management

* Set monthly budget
* Set category-wise budget
* Track remaining budget
* Get budget warnings

### 📊 Spending Analysis

* Monthly spending analysis
* Category-wise spending
* Highest spending category
* Spending trends
* Budget vs actual spending

### 📈 Dashboard

The dashboard displays:

* Total Expenses
* Monthly Budget
* Remaining Budget
* Recent Transactions
* Category-wise Expenses
* Spending Analysis

---

## 🛠️ Technologies Used

### Frontend

* React.js
* JavaScript
* HTML
* CSS
* Vite

### Backend

* Node.js
* Express.js

### Database

* MySQL

### Tools

* VS Code
* Git
* GitHub
* Postman

---

## 📂 Project Structure

```text
expense-tracker/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   ├── server.js
│   └── package.json
│
├── database/
│   └── schema.sql
│
├── .gitignore
└── README.md
```

---

## ⚙️ Installation

### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
```

### Step 2: Open the Project

```bash
cd expense-tracker
```

### Step 3: Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 4: Install Backend Dependencies

Open a new terminal:

```bash
cd backend
npm install
```

---

## 🔑 Environment Variables

Create a `.env` file inside the `backend` folder.

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=expense_tracker
```

> Do not upload the `.env` file to GitHub.

---

## ▶️ Running the Project

### Start Backend

```bash
cd backend
npm start
```

### Start Frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

Then open the local URL shown in the terminal.

---

## 📊 Example

A family has a monthly budget of **₹30,000**.

| Category      |      Amount |
| ------------- | ----------: |
| Dining        |      ₹7,500 |
| Shopping      |      ₹6,000 |
| Entertainment |      ₹4,500 |
| Subscriptions |      ₹2,500 |
| Transport     |      ₹3,000 |
| Household     |      ₹5,000 |
| **Total**     | **₹28,500** |

The system helps identify **Dining and Shopping** as major spending categories.

---

## 🔄 Application Flow

```text
Register / Login
       ↓
   Dashboard
       ↓
 Add Expense
       ↓
Select Category
       ↓
 Save Expense
       ↓
Set Monthly Budget
       ↓
Spending Analysis
       ↓
View Insights
       ↓
Better Financial Planning
```

---

## 🔌 API Endpoints

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
```

### Expenses

```text
GET    /api/expenses
POST   /api/expenses
PUT    /api/expenses/:id
DELETE /api/expenses/:id
```

### Budget

```text
GET  /api/budget
POST /api/budget
```

### Analytics

```text
GET /api/analytics
```

---

## 🚀 Future Enhancements

* AI-based spending prediction
* Expense alerts
* Monthly PDF reports
* Mobile application
* Family member accounts
* Saving recommendations
* Subscription reminders
* Advanced spending analytics
* Cloud deployment

---

## 👩‍💻 Project Details

**Project Name:** Family Spending Pattern Analysis

**Project Type:** Full-Stack Web Application

**Domain:** Expense Management & Personal Finance

**Purpose:** To help families track expenses, understand spending patterns, and manage their monthly budgets effectively.

---

## 📜 License

This project is created for **educational purposes**.
