import React from 'react';
import { useExpenses, UseExpensesOptions } from './hooks/useExpenses';
import { ExpenseForm } from './components/ExpenseForm';
import { MonthlyDashboard } from './components/MonthlyDashboard';
import { ExpenseList } from './components/ExpenseList';
import './App.css';

export type AppProps = UseExpensesOptions;

export const App: React.FC<AppProps> = (props) => {
  const {
    expenses,
    monthlyExpenses,
    selectedMonth,
    setSelectedMonth,
    monthlyTotal,
    categoryBreakdown,
    availableMonths,
    addExpense,
    deleteExpense,
  } = useExpenses(props);

  return (
    <div className="app-container">
      <header className="header">
        <h1>Expense Tracker</h1>
        <p>Track your daily expenditures, organize by category, and monitor monthly spending.</p>
      </header>

      <main>
        <div className="app-grid">
          <section className="app-panel form-panel" aria-labelledby="form-heading">
            <h3 id="form-heading" className="panel-title">
              Add Expense
            </h3>
            <ExpenseForm onAddExpense={addExpense} />
          </section>

          <section className="card" aria-labelledby="overview-heading">
            <h2 id="overview-heading">Overview</h2>
            <MonthlyDashboard
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              totalSpend={monthlyTotal}
              expenseCount={monthlyExpenses.length}
              breakdown={categoryBreakdown}
              availableMonths={availableMonths}
            />
            {expenses.length === 0 && (
              <div className="empty-state">
                <p>Welcome to Expense Tracker. Ready for expense logging and monthly analytics.</p>
              </div>
            )}
          </section>
        </div>

        <section className="app-panel list-panel" aria-labelledby="list-heading">
          <div className="section-header">
            <h3 id="list-heading" className="panel-title">
              Expense History ({expenses.length})
            </h3>
          </div>
          <ExpenseList expenses={expenses} onDeleteExpense={deleteExpense} />
        </section>
      </main>
    </div>
  );
};

export default App;
