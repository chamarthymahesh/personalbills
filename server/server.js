import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import {
  UtilityBill,
  Insurance,
  InterestLoan,
  ConstructionProject,
  PersonalDebt,
  Car,
  RentalIncome,
  AdminConfig
} from './models/Models.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// DB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas successfully.'))
  .catch((err) => console.error('MongoDB connection error:', err));

// ======================
// Admin Config Routes
// ======================
app.get('/api/config', async (req, res) => {
  try {
    let config = await AdminConfig.findOne({ configKey: 'main' });
    if (!config) {
      config = await AdminConfig.create({ configKey: 'main' });
    }
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/config', async (req, res) => {
  try {
    const config = await AdminConfig.findOneAndUpdate(
      { configKey: 'main' },
      req.body,
      { new: true, upsert: true }
    );
    res.json(config);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Dashboard Aggregate Summary Route
app.get('/api/dashboard/summary', async (req, res) => {
  try {
    // Fetch all data in parallel for faster response times
    const [bills, insurances, loans, debts, projects, rentals] = await Promise.all([
      UtilityBill.find(),
      Insurance.find(),
      InterestLoan.find(),
      PersonalDebt.find({ status: 'pending' }),
      ConstructionProject.find(),
      RentalIncome.find({ status: 'active' })
    ]);

    // 1. Bills - Calculate current month's bills paid
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12
    let currentMonthBillsPaid = 0;
    
    bills.forEach(b => {
      const pay = b.payments?.find(p => p.year === currentYear && p.month === currentMonth);
      if (pay) {
        currentMonthBillsPaid += pay.amount;
      }
    });

    const pendingBillsCount = 0; // Deprecated with new schema, could determine based on expected vs paid
    const pendingBillsAmount = 0; // Deprecated

    // 2. Insurances
    const activeInsurancesCount = insurances.filter(i => i.status === 'active').length;
    
    // 3. Interest Loans
    let totalLentPrincipal = 0;
    let totalBorrowedPrincipal = 0;
    
    loans.forEach(loan => {
      if (loan.status === 'active') {
        const principalAdjustment = loan.payments
          .filter(p => p.paymentType === 'add_principal')
          .reduce((sum, p) => sum + p.amount, 0);
        const principalRepaid = loan.payments
          .filter(p => p.paymentType === 'principal_repayment')
          .reduce((sum, p) => sum + p.amount, 0);
        const currentPrincipal = loan.principalAmount + principalAdjustment - principalRepaid;

        if (loan.type === 'lent') {
          totalLentPrincipal += currentPrincipal;
        } else {
          totalBorrowedPrincipal += currentPrincipal;
        }
      }
    });

    // 4. Debts (Family/Friends)
    let totalDebtsGiven = 0;
    let totalDebtsTaken = 0;

    debts.forEach(d => {
      const repaid = d.repayments.reduce((sum, r) => sum + r.amount, 0);
      const remaining = d.amount - repaid;
      if (d.type === 'given') {
        totalDebtsGiven += remaining;
      } else {
        totalDebtsTaken += remaining;
      }
    });

    // 5. Construction
    const totalConstructionSpent = projects.reduce((total, project) => {
      const projectSpent = project.expenses.reduce((sum, e) => sum + e.amount, 0);
      return total + projectSpent;
    }, 0);

    // 6. Rentals
    const totalMonthlyRentExpectation = rentals.reduce((sum, r) => sum + r.monthlyRent, 0);
    
    // Calculate current month's received rent
    let currentMonthRentReceived = 0;
    rentals.forEach(r => {
      const pay = r.payments.find(p => p.year === currentYear && p.month === currentMonth);
      if (pay) {
        currentMonthRentReceived += pay.amountPaid;
      }
    });

    // 7. General Recent Transactions / Logs for feed
    const feed = [];
    
    // Add bills payments
    bills.forEach(b => {
      if (b.payments) {
        b.payments.forEach(p => {
          feed.push({
            date: p.datePaid,
            type: 'Bill Payment',
            title: `Paid bill: ${b.name} (${b.type})`,
            amount: -p.amount,
            color: '#f87171'
          });
        });
      }
    });


    // Add insurance payments
    insurances.forEach(i => {
      feed.push({
        date: i.createdAt,
        type: 'Insurance Policy',
        title: `Policy added: ${i.policyName} (${i.provider})`,
        amount: -i.premiumAmount,
        color: '#fbbf24'
      });
    });

    // Add Loan Transactions
    loans.forEach(l => {
      l.payments.forEach(p => {
        const typeStr = p.paymentType === 'interest_payment' ? 'Interest Interest Received/Paid' : 'Principal Modification';
        const isLent = l.type === 'lent';
        // If lent, interest_payment is income (+), principal_repayment is income (+)
        // If borrowed, interest_payment is expense (-), principal_repayment is expense (-)
        let amt = p.amount;
        if (l.type === 'borrowed') amt = -amt;

        feed.push({
          date: p.date,
          type: 'Interest Loan Transaction',
          title: `${l.personName} - ${p.paymentType.replace('_', ' ')}`,
          amount: amt,
          color: amt >= 0 ? '#34d399' : '#f87171'
        });
      });
    });

    // Add Debt repayments
    debts.forEach(d => {
      d.repayments.forEach(r => {
        const isGiven = d.type === 'given';
        let amt = r.amount; // If we gave, repayment is incoming (+)
        if (!isGiven) amt = -amt; // If we took, repayment is outgoing (-)
        feed.push({
          date: r.date,
          type: 'Debt Repayment',
          title: `${isGiven ? 'Received from' : 'Paid to'} ${d.personName}`,
          amount: amt,
          color: amt >= 0 ? '#34d399' : '#f87171'
        });
      });
    });

    // Add Construction Expenses
    projects.forEach(p => {
      p.expenses.forEach(e => {
        feed.push({
          date: e.date,
          type: 'Construction Expense',
          title: `[${p.projectName}] ${e.itemDescription} (${e.category})`,
          amount: -e.amount,
          color: '#60a5fa'
        });
      });
    });

    // Add Rental Collections
    rentals.forEach(r => {
      r.payments.forEach(p => {
        feed.push({
          date: p.datePaid,
          type: 'Rental Income',
          title: `Rent: ${r.tenantName} - Unit ${r.unitNumber}`,
          amount: p.amountPaid,
          color: '#34d399'
        });
      });
    });

    // Sort feed by date descending
    feed.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      summary: {
        pendingBillsCount,
        pendingBillsAmount,
        activeInsurancesCount,
        totalLentPrincipal,
        totalBorrowedPrincipal,
        totalDebtsGiven,
        totalDebtsTaken,
        totalConstructionSpent,
        totalMonthlyRentExpectation,
        currentMonthRentReceived
      },
      recentFeed: feed.slice(0, 10)
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Server error fetching dashboard summary' });
  }
});

// Dropdowns Master Data Route
app.get('/api/dropdowns', async (req, res) => {
  try {
    const cars = await Car.find({}, 'name plateNumber');
    const insurances = await Insurance.find({}, 'policyName provider type');
    const projects = await ConstructionProject.find({}, 'projectName');
    const rentals = await RentalIncome.find({}, 'buildingName unitNumber tenantName');
    
    const loanContacts = await InterestLoan.distinct('personName');
    const debtContacts = await PersonalDebt.distinct('personName');
    const contacts = Array.from(new Set([...loanContacts, ...debtContacts])).sort();

    res.json({
      cars,
      insurances,
      projects,
      rentals,
      contacts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Utility Bills Routes
app.get('/api/bills', async (req, res) => {
  try {
    const bills = await UtilityBill.find().sort({ name: 1 });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bills', async (req, res) => {
  try {
    const newBill = new UtilityBill(req.body);
    await newBill.save();
    res.status(201).json(newBill);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/bills/:id', async (req, res) => {
  try {
    const updated = await UtilityBill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/bills/:id/payments', async (req, res) => {
  try {
    const bill = await UtilityBill.findById(req.params.id);
    if (!bill) return res.status(404).json({ error: 'Bill connection not found' });
    
    bill.payments.push(req.body);
    await bill.save();
    res.json(bill);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a specific payment on a bill (edit amount, date, notes)
app.put('/api/bills/:id/payments/:paymentId', async (req, res) => {
  try {
    const bill = await UtilityBill.findById(req.params.id);
    if (!bill) return res.status(404).json({ error: 'Bill connection not found' });
    const payment = bill.payments.id(req.params.paymentId);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    
    Object.assign(payment, req.body);
    await bill.save();
    res.json(bill);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a specific payment from a bill
app.delete('/api/bills/:id/payments/:paymentId', async (req, res) => {
  try {
    const bill = await UtilityBill.findById(req.params.id);
    if (!bill) return res.status(404).json({ error: 'Bill connection not found' });
    bill.payments.pull({ _id: req.params.paymentId });
    await bill.save();
    res.json(bill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bills/:id', async (req, res) => {
  try {
    await UtilityBill.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bill deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Insurances Routes
app.get('/api/insurances', async (req, res) => {
  try {
    const insurances = await Insurance.find().sort({ dueDate: 1 });
    res.json(insurances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/insurances', async (req, res) => {
  try {
    const newIns = new Insurance(req.body);
    await newIns.save();
    res.status(201).json(newIns);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/insurances/:id', async (req, res) => {
  try {
    const updated = await Insurance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/insurances/:id/payments', async (req, res) => {
  try {
    const policy = await Insurance.findById(req.params.id);
    if (!policy) return res.status(404).json({ error: 'Policy not found' });
    
    policy.payments.push(req.body);

    // Auto-advance the due date based on frequency
    if (policy.dueDate && policy.frequency) {
      const newDueDate = new Date(policy.dueDate);
      if (policy.frequency === 'monthly') {
        newDueDate.setMonth(newDueDate.getMonth() + 1);
      } else if (policy.frequency === 'quarterly') {
        newDueDate.setMonth(newDueDate.getMonth() + 3);
      } else if (policy.frequency === 'half-yearly') {
        newDueDate.setMonth(newDueDate.getMonth() + 6);
      } else if (policy.frequency === 'yearly') {
        newDueDate.setFullYear(newDueDate.getFullYear() + 1);
      }
      policy.dueDate = newDueDate;
    }

    await policy.save();
    res.json(policy);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/insurances/:id', async (req, res) => {
  try {
    await Insurance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Insurance policy deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Interest Loans Routes
app.get('/api/loans', async (req, res) => {
  try {
    const loans = await InterestLoan.find().sort({ createdAt: -1 });
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/loans', async (req, res) => {
  try {
    const newLoan = new InterestLoan(req.body);
    await newLoan.save();
    res.status(201).json(newLoan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/loans/:id', async (req, res) => {
  try {
    const updated = await InterestLoan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/loans/:id/payments', async (req, res) => {
  try {
    const loan = await InterestLoan.findById(req.params.id);
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    
    loan.payments.push(req.body);
    await loan.save();
    res.json(loan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/loans/:id', async (req, res) => {
  try {
    await InterestLoan.findByIdAndDelete(req.params.id);
    res.json({ message: 'Loan deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Construction Projects Routes
app.get('/api/construction', async (req, res) => {
  try {
    const projects = await ConstructionProject.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/construction', async (req, res) => {
  try {
    const newProject = new ConstructionProject(req.body);
    await newProject.save();
    res.status(201).json(newProject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/construction/:id', async (req, res) => {
  try {
    const updated = await ConstructionProject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/construction/:id/expenses', async (req, res) => {
  try {
    const project = await ConstructionProject.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    project.expenses.push(req.body);
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/construction/:id', async (req, res) => {
  try {
    await ConstructionProject.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Personal Debts Routes
app.get('/api/debts', async (req, res) => {
  try {
    const debts = await PersonalDebt.find().sort({ createdAt: -1 });
    res.json(debts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/debts', async (req, res) => {
  try {
    const newDebt = new PersonalDebt(req.body);
    await newDebt.save();
    res.status(201).json(newDebt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/debts/:id', async (req, res) => {
  try {
    const updated = await PersonalDebt.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/debts/:id/repayments', async (req, res) => {
  try {
    const debt = await PersonalDebt.findById(req.params.id);
    if (!debt) return res.status(404).json({ error: 'Debt record not found' });
    
    debt.repayments.push(req.body);
    
    // Check if fully repaid and auto settle
    const totalRepaid = debt.repayments.reduce((sum, r) => sum + r.amount, 0);
    if (totalRepaid >= debt.amount) {
      debt.status = 'settled';
    }
    
    await debt.save();
    res.json(debt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/debts/:id', async (req, res) => {
  try {
    await PersonalDebt.findByIdAndDelete(req.params.id);
    res.json({ message: 'Debt record deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cars Routes
app.get('/api/cars', async (req, res) => {
  try {
    const cars = await Car.find().sort({ createdAt: -1 });
    res.json(cars);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cars', async (req, res) => {
  try {
    const newCar = new Car(req.body);
    await newCar.save();
    res.status(201).json(newCar);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/cars/:id', async (req, res) => {
  try {
    const updated = await Car.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/cars/:id/maintenance', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ error: 'Car not found' });
    
    car.maintenanceLog.push(req.body);
    await car.save();
    res.json(car);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/cars/:id', async (req, res) => {
  try {
    await Car.findByIdAndDelete(req.params.id);
    res.json({ message: 'Car deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rental Income Routes
app.get('/api/rentals', async (req, res) => {
  try {
    const rentals = await RentalIncome.find().sort({ buildingName: 1, unitNumber: 1 });
    res.json(rentals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rentals', async (req, res) => {
  try {
    const newRental = new RentalIncome(req.body);
    await newRental.save();
    res.status(201).json(newRental);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/rentals/:id', async (req, res) => {
  try {
    const updated = await RentalIncome.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/rentals/:id/payments', async (req, res) => {
  try {
    const rental = await RentalIncome.findById(req.params.id);
    if (!rental) return res.status(404).json({ error: 'Rental property not found' });
    
    rental.payments.push(req.body);
    await rental.save();
    res.json(rental);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/rentals/:id', async (req, res) => {
  try {
    await RentalIncome.findByIdAndDelete(req.params.id);
    res.json({ message: 'Rental property deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (email !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = Buffer.from(JSON.stringify({ email, role: 'admin', ts: Date.now() })).toString('base64');
  res.json({ token });
});

// Start Server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
