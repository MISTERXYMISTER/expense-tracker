import React from 'react';

export const App: React.FC = () => {
  return (
    <div className="app-container">
      <header className="header">
        <h1>Expense Tracker</h1>
        <p>Track your daily expenditures, organize by category, and monitor monthly spending.</p>
      </header>

      <main>
        <section className="card">
          <h2>Overview</h2>
          <div className="empty-state">
            <p>Welcome to Expense Tracker. Ready for expense logging and monthly analytics.</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
