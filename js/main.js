// ==============================
// FINANCIAL HEALTH SCORE — MAIN JS
// ==============================

// Mobile Nav
const hamburger = document.querySelector('.hamburger');
const mobileNav = document.querySelector('.mobile-nav');
const mobileClose = document.querySelector('.mobile-close');
if(hamburger) hamburger.addEventListener('click', () => mobileNav.classList.add('open'));
if(mobileClose) mobileClose.addEventListener('click', () => mobileNav.classList.remove('open'));

// FAQ Accordion
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
    if(!isOpen) item.classList.add('open');
  });
});

// ==============================
// FINANCIAL HEALTH SCORE CALCULATOR
// ==============================
const calcForm = document.getElementById('calcForm');
if(calcForm) {
  calcForm.addEventListener('submit', function(e) {
    e.preventDefault();
    calculateScore();
  });
}

function calculateScore() {
  const income = parseFloat(document.getElementById('income').value) || 0;
  const expenses = parseFloat(document.getElementById('expenses').value) || 0;
  const savings = parseFloat(document.getElementById('savings').value) || 0;
  const loans = parseFloat(document.getElementById('loans').value) || 0;
  const emi = parseFloat(document.getElementById('emi').value) || 0;
  const dependents = parseInt(document.getElementById('dependents').value) || 0;

  // Validate
  let valid = true;
  if(income <= 0) { showError('income', 'Please enter a valid income'); valid = false; } else clearError('income');
  if(expenses < 0) { showError('expenses', 'Expenses cannot be negative'); valid = false; } else clearError('expenses');
  if(!valid) return;

  // ---- SCORING LOGIC ----
  let score = 100;

  // 1. Expense Ratio (expenses/income)
  const expenseRatio = income > 0 ? expenses / income : 1;
  if(expenseRatio > 0.9) score -= 30;
  else if(expenseRatio > 0.75) score -= 20;
  else if(expenseRatio > 0.6) score -= 10;
  else if(expenseRatio > 0.5) score -= 5;

  // 2. EMI Burden (emi/income) — ideal < 30%
  const emiBurden = income > 0 ? emi / income : 0;
  if(emiBurden > 0.5) score -= 25;
  else if(emiBurden > 0.4) score -= 18;
  else if(emiBurden > 0.3) score -= 10;
  else if(emiBurden > 0.2) score -= 4;

  // 3. Debt-to-Income (loans / annual income)
  const annualIncome = income * 12;
  const dti = annualIncome > 0 ? loans / annualIncome : 0;
  if(dti > 5) score -= 20;
  else if(dti > 3) score -= 12;
  else if(dti > 1.5) score -= 6;

  // 4. Emergency Fund (savings / monthly expenses) — target: 6 months
  const monthlyExpTotal = expenses + emi;
  const efMonths = monthlyExpTotal > 0 ? savings / monthlyExpTotal : 0;
  if(efMonths < 1) score -= 15;
  else if(efMonths < 3) score -= 8;
  else if(efMonths < 6) score -= 3;

  // 5. Dependents load
  if(dependents >= 3) score -= 5;

  // 6. Savings surplus (savings/income ratio)
  const netMonthly = income - expenses - emi;
  const savingsRate = income > 0 ? netMonthly / income : -1;
  if(savingsRate < 0) score -= 10;
  else if(savingsRate < 0.05) score -= 4;

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Derived metrics
  const emergencyMonths = monthlyExpTotal > 0 ? (savings / monthlyExpTotal).toFixed(1) : '—';
  const debtRatio = annualIncome > 0 ? ((loans / annualIncome) * 100).toFixed(1) : '0';
  const emiBurdenPct = income > 0 ? ((emi / income) * 100).toFixed(1) : '0';
  const expRatioPct = income > 0 ? ((expenses / income) * 100).toFixed(1) : '0';

  // Risk level
  let risk, riskClass, riskColor;
  if(score >= 70) { risk = 'Low Risk'; riskClass = 'risk-low'; riskColor = '#1DB954'; }
  else if(score >= 40) { risk = 'Moderate Risk'; riskClass = 'risk-moderate'; riskColor = '#F59E0B'; }
  else { risk = 'High Risk'; riskClass = 'risk-high'; riskColor = '#EF4444'; }

  // Suggestions
  const suggestions = [];
  if(emiBurden > 0.3) suggestions.push('Your EMI burden is above 30%. Consider prepaying or refinancing loans.');
  if(efMonths < 3) suggestions.push('Build an emergency fund covering at least 3–6 months of expenses.');
  if(expenseRatio > 0.75) suggestions.push('High expense ratio — review discretionary spending and trim 10–15%.');
  if(dti > 3) suggestions.push('Debt-to-income ratio is high. Prioritize loan repayment before new credit.');
  if(savingsRate < 0.1 && income > 0) suggestions.push('Aim to save at least 10–20% of income every month via SIP or RD.');
  if(score >= 70) suggestions.push('Great financial health! Stay consistent and explore index fund investments.');

  // Render
  displayResults({ score, risk, riskClass, riskColor, emergencyMonths, debtRatio, emiBurdenPct, expRatioPct, suggestions, income, expenses, emi, savings });
}

function displayResults(d) {
  const container = document.getElementById('resultsBox');
  const placeholder = document.getElementById('placeholderState');
  if(placeholder) placeholder.style.display = 'none';
  container.style.display = 'block';

  // Ring
  const circumference = 2 * Math.PI * 70; // r=70
  const offset = circumference - (d.score / 100) * circumference;
  document.getElementById('ringFill').style.strokeDasharray = circumference;
  document.getElementById('ringFill').style.strokeDashoffset = offset;
  document.getElementById('ringFill').style.stroke = d.riskColor;
  document.getElementById('scoreNum').textContent = d.score;
  document.getElementById('scoreNum').style.color = d.riskColor;
  document.getElementById('riskLabel').textContent = d.risk;
  document.getElementById('riskLabel').className = 'result-risk-label ' + d.riskClass.replace('risk-', '');

  // Metrics
  document.getElementById('metricEF').textContent = d.emergencyMonths + ' months';
  document.getElementById('metricDTI').textContent = d.debtRatio + '%';
  document.getElementById('metricEMI').textContent = d.emiBurdenPct + '%';
  document.getElementById('metricExp').textContent = d.expRatioPct + '%';

  // Progress bars
  setBar('barEF', Math.min(100, (parseFloat(d.emergencyMonths) / 6) * 100), parseFloat(d.emergencyMonths) >= 3 ? 'green' : parseFloat(d.emergencyMonths) >= 1 ? 'amber' : 'red');
  setBar('barDTI', Math.min(100, parseFloat(d.debtRatio) / 5), parseFloat(d.debtRatio) < 150 ? 'green' : parseFloat(d.debtRatio) < 300 ? 'amber' : 'red');
  setBar('barEMI', Math.min(100, parseFloat(d.emiBurdenPct) / 60 * 100), parseFloat(d.emiBurdenPct) < 30 ? 'green' : parseFloat(d.emiBurdenPct) < 40 ? 'amber' : 'red');
  setBar('barExp', Math.min(100, parseFloat(d.expRatioPct) / 100 * 100), parseFloat(d.expRatioPct) < 60 ? 'green' : parseFloat(d.expRatioPct) < 75 ? 'amber' : 'red');

  // Suggestions
  const sug = document.getElementById('suggestionsList');
  sug.innerHTML = d.suggestions.map(s => `<div class="suggestion-item"><span class="suggestion-icon">✓</span><span>${s}</span></div>`).join('');
}

function setBar(id, pct, color) {
  const el = document.getElementById(id);
  if(el) { el.style.width = pct + '%'; el.className = 'progress-fill ' + (color !== 'green' ? color : ''); }
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if(el) el.classList.add('error');
  const errEl = document.getElementById(id + '-err');
  if(errEl) errEl.textContent = msg;
}
function clearError(id) {
  const el = document.getElementById(id);
  if(el) el.classList.remove('error');
  const errEl = document.getElementById(id + '-err');
  if(errEl) errEl.textContent = '';
}

// ==============================
// EMI CALCULATOR
// ==============================
const emiForm = document.getElementById('emiForm');
if(emiForm) {
  emiForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const principal = parseFloat(document.getElementById('emiPrincipal').value);
    const rate = parseFloat(document.getElementById('emiRate').value) / 12 / 100;
    const tenure = parseInt(document.getElementById('emiTenure').value);
    if(!principal || !rate || !tenure) return;
    const emi = (principal * rate * Math.pow(1+rate, tenure)) / (Math.pow(1+rate, tenure) - 1);
    const totalAmt = emi * tenure;
    const totalInt = totalAmt - principal;
    document.getElementById('emiResult').innerHTML = `
      <div class="metric-row"><span class="metric-name">Monthly EMI</span><span class="metric-val green">₹${fmt(emi)}</span></div>
      <div class="metric-row"><span class="metric-name">Total Amount Payable</span><span class="metric-val">₹${fmt(totalAmt)}</span></div>
      <div class="metric-row"><span class="metric-name">Total Interest</span><span class="metric-val">₹${fmt(totalInt)}</span></div>
      <div class="metric-row"><span class="metric-name">Principal Amount</span><span class="metric-val">₹${fmt(principal)}</span></div>
    `;
    document.getElementById('emiResult').style.display = 'block';
  });
}

// ==============================
// SIP CALCULATOR
// ==============================
const sipForm = document.getElementById('sipForm');
if(sipForm) {
  sipForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const monthly = parseFloat(document.getElementById('sipMonthly').value);
    const rate = parseFloat(document.getElementById('sipRate').value) / 12 / 100;
    const years = parseInt(document.getElementById('sipYears').value);
    const n = years * 12;
    const fv = monthly * ((Math.pow(1+rate, n) - 1) / rate) * (1 + rate);
    const invested = monthly * n;
    const gains = fv - invested;
    document.getElementById('sipResult').innerHTML = `
      <div class="metric-row"><span class="metric-name">Estimated Returns</span><span class="metric-val green">₹${fmt(fv)}</span></div>
      <div class="metric-row"><span class="metric-name">Total Invested</span><span class="metric-val">₹${fmt(invested)}</span></div>
      <div class="metric-row"><span class="metric-name">Wealth Gained</span><span class="metric-val">₹${fmt(gains)}</span></div>
      <div class="metric-row"><span class="metric-name">Return Multiple</span><span class="metric-val">${(fv/invested).toFixed(2)}x</span></div>
    `;
    document.getElementById('sipResult').style.display = 'block';
  });
}

// ==============================
// EMERGENCY FUND CALCULATOR
// ==============================
const efForm = document.getElementById('efForm');
if(efForm) {
  efForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const expenses = parseFloat(document.getElementById('efExpenses').value);
    const emi = parseFloat(document.getElementById('efEmi').value) || 0;
    const months = parseInt(document.getElementById('efMonths').value);
    const currentSavings = parseFloat(document.getElementById('efSavings').value) || 0;
    const target = (expenses + emi) * months;
    const shortfall = Math.max(0, target - currentSavings);
    const covered = Math.min(100, (currentSavings / target) * 100).toFixed(0);
    document.getElementById('efResult').innerHTML = `
      <div class="metric-row"><span class="metric-name">Target Emergency Fund</span><span class="metric-val">₹${fmt(target)}</span></div>
      <div class="metric-row"><span class="metric-name">Current Coverage</span><span class="metric-val">${covered}%</span></div>
      <div class="metric-row"><span class="metric-name">Shortfall</span><span class="metric-val" style="color:${shortfall > 0 ? '#EF4444' : '#1DB954'}">₹${fmt(shortfall)}</span></div>
      <div class="metric-row"><span class="metric-name">Monthly Target to save</span><span class="metric-val green">₹${fmt(shortfall/6)}/mo</span></div>
    `;
    document.getElementById('efResult').style.display = 'block';
  });
}

// Utility
function fmt(n) {
  return Math.round(n).toLocaleString('en-IN');
}

// Animate elements on scroll
const observer = new IntersectionObserver(entries => {
  entries.forEach(el => {
    if(el.isIntersecting) el.target.classList.add('visible');
  });
}, { threshold: 0.15 });
document.querySelectorAll('.feature-card, .blog-card, .step, .why-card').forEach(el => {
  el.style.opacity = '0'; el.style.transform = 'translateY(20px)'; el.style.transition = 'opacity 0.5s, transform 0.5s';
  observer.observe(el);
});
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.visible').forEach(el => {
    el.style.opacity = '1'; el.style.transform = 'none';
  });
});
// Polyfill for IntersectionObserver callback
document.querySelectorAll('.feature-card, .blog-card, .step, .why-card').forEach(el => {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting) { el.style.opacity='1'; el.style.transform='none'; io.disconnect(); }});
  }, {threshold: 0.1});
  io.observe(el);
});
