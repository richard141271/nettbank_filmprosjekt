const app = {
    state: {
        accounts: {
            '21208': { 
                name: 'Visakort bulder', 
                id: '3610.71.65864',
                balance: 21208, 
                spent: 7601,
                transactions: [
                    { name: 'EasyPark', date: 'I dag 06:02', amount: -74, reserved: true, icon: 'local_parking' },
                    { name: 'Til Sparekonto BB', date: 'I går', amount: -2000, reserved: false, icon: 'savings' },
                    { name: 'Til Sparekonto BB', date: 'I går', amount: -1200, reserved: false, icon: 'savings' },
                    { name: 'Ruter', date: '18.01', amount: -42, reserved: false, icon: 'directions_bus' },
                    { name: 'Matbutikk', date: '17.01', amount: -450, reserved: false, icon: 'shopping_cart' }
                ]
            },
            '1': { 
                name: 'Konto 2', 
                id: '1234.56.78901',
                balance: 1, 
                spent: 1,
                transactions: [
                    { name: 'Renteinntekt', date: '31.12', amount: 1, reserved: false, icon: 'trending_up' }
                ]
            },
            '2': {
                name: 'Sparekonto',
                id: '1234.56.11111',
                balance: 150000,
                spent: 0,
                transactions: [
                     { name: 'Spareavtale', date: '15.01', amount: 5000, reserved: false, icon: 'savings' }
                ]
            },
            '3': {
                name: 'Bufferkonto',
                id: '1234.56.22222',
                balance: 25000,
                spent: 0,
                transactions: [
                    { name: 'Overføring', date: '10.01', amount: 2000, reserved: false, icon: 'swap_horiz' }
                ]
            }
        },
        totalBalance: 0, // Will be calculated
        historyStack: [], // To track navigation
        activeAccountId: null, // Currently viewed account
        paymentState: {
            fromAccount: '21208',
            toAccount: '1',
            message: '',
            date: 'I dag'
        }
    },

    init: function() {
        this.loadState();
        this.calculateTotalBalance();
        this.setupNavigation();
        this.updateUI();
    },

    loadState: function() {
        const saved = localStorage.getItem('nettbankState');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.accounts) {
                    this.state.accounts = parsed.accounts;
                }
            } catch (e) {
                console.error("Failed to load state", e);
            }
        }
    },

    saveState: function() {
        try {
            localStorage.setItem('nettbankState', JSON.stringify({
                accounts: this.state.accounts
            }));
        } catch (e) {
            console.error("Failed to save state", e);
        }
    },

    calculateTotalBalance: function() {
         this.state.totalBalance = Object.values(this.state.accounts).reduce((sum, acc) => sum + acc.balance, 0);
    },

    setupNavigation: function() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                // Remove active class from all
                navItems.forEach(nav => nav.classList.remove('active'));
                document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));

                // Add active class to clicked
                const targetId = item.getAttribute('data-target');
                item.classList.add('active');
                document.getElementById(targetId).classList.add('active');
                
                // Clear history when switching main tabs
                this.state.historyStack = [];
            });
        });
    },

    openAccount: function(accountId) {
        const account = this.state.accounts[accountId];
        if (!account) return;

        this.state.activeAccountId = accountId;

        // Update Account Detail View
        document.getElementById('acc-detail-name').innerText = account.name;
        document.getElementById('acc-detail-id').innerText = account.id;
        document.getElementById('acc-detail-balance').innerText = this.formatCurrency(account.balance);

        // Populate Transactions
        const list = document.querySelector('.transaction-list');
        list.innerHTML = `
            <div class="month-header">
                <span>JANUAR</span>
                <span></span>
            </div>
        `;

        account.transactions.forEach(t => {
            list.innerHTML += `
                <div class="transaction-item">
                    <div class="trans-icon"><span class="material-icons-round">${t.icon}</span></div>
                    <div class="trans-info">
                        <h4>${t.name}</h4>
                        <span class="subtext">${t.date}</span>
                    </div>
                    <div class="trans-amount">
                        <span class="negative">${t.amount > 0 ? '+' : ''}${this.formatCurrency(t.amount)}</span>
                        ${t.reserved ? '<span class="status-tag">Reservert</span>' : ''}
                    </div>
                </div>
            `;
        });

        // Show View
        this.navigateTo('view-account-details');
    },

    navigateTo: function(viewId) {
        const currentView = document.querySelector('.view.active');
        // Only push to history if we are changing views and it's not the same view
        if (currentView && currentView.id !== viewId) {
             this.state.historyStack.push(currentView.id);
        }

        // Hide all views
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        
        // Show target view
        document.getElementById(viewId).classList.add('active');
        
        // Update bottom nav
        this.updateBottomNav(viewId);
    },

    goBack: function() {
        if (this.state.historyStack.length === 0) {
             // Fallback to home if no history
             this.changeView('view-hjem');
             return;
        }

        const previousViewId = this.state.historyStack.pop();
        this.changeView(previousViewId);
    },

    // Helper to switch view without messing with history (used by goBack)
    changeView: function(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        this.updateBottomNav(viewId);
    },

    updateBottomNav: function(viewId) {
        // If the view is one of the main tabs, highlight it. 
        // If not (e.g. detail view), we could keep the previous one active or deselect.
        // For simplicity, we try to find a matching nav item.
        let found = false;
        document.querySelectorAll('.nav-item').forEach(nav => {
            if (nav.getAttribute('data-target') === viewId) {
                nav.classList.add('active');
                found = true;
            } else {
                nav.classList.remove('active');
            }
        });
        
        // If we are in a detail view, we might want to keep the "parent" active?
        // But for now, deselecting main tabs when deep in navigation is also fine visually to indicate "depth".
        // Or we could check history stack to see what was the last "main" view.
        if (!found && this.state.historyStack.length > 0) {
            // Find the last view in history that is a main tab
            for (let i = this.state.historyStack.length - 1; i >= 0; i--) {
                const histId = this.state.historyStack[i];
                const navItem = document.querySelector(`.nav-item[data-target="${histId}"]`);
                if (navItem) {
                    navItem.classList.add('active');
                    break;
                }
            }
        }
    },

    startPaymentFromActiveAccount: function() {
        if (this.state.activeAccountId) {
            this.state.paymentState.fromAccount = this.state.activeAccountId;
            
            // Try to find a logical 'to' account (not the same as from)
            const accountIds = Object.keys(this.state.accounts);
            const otherAccount = accountIds.find(id => id !== this.state.activeAccountId);
            if (otherAccount) {
                this.state.paymentState.toAccount = otherAccount;
            }
        }
        
        // Reset message and date
        this.state.paymentState.message = '';
        this.state.paymentState.date = 'I dag';
        
        this.updateUI();
        this.navigateTo('view-pay-details');
    },

    openMessageInput: function() {
        const msg = prompt("Skriv inn melding eller KID:", this.state.paymentState.message);
        if (msg !== null) {
            this.state.paymentState.message = msg;
            this.updateUI();
        }
    },

    openDateInput: function() {
        const dateInput = document.getElementById('hidden-date-input');
        
        // Handle change
        dateInput.onchange = (e) => {
            if (e.target.value) {
                // Format date to DD.MM.YYYY
                const parts = e.target.value.split('-');
                if (parts.length === 3) {
                     this.state.paymentState.date = `${parts[2]}.${parts[1]}.${parts[0]}`;
                } else {
                    this.state.paymentState.date = e.target.value;
                }
                this.updateUI();
            }
        };
        
        // Trigger click using showPicker if available (modern browsers) or focus/click hack
        try {
            dateInput.showPicker();
        } catch (err) {
            dateInput.click();
        }
    },

    processPayment: function() {
        // Use the large input for amount
        const amountInput = document.getElementById('pay-amount-large');
        const amount = parseFloat(amountInput.value.replace(/\s/g, '').replace(',', '.'));
        
        const fromAccount = this.state.paymentState.fromAccount;
        const toAccount = this.state.paymentState.toAccount;

        if (!amount || amount <= 0) {
            alert('Vennligst oppgi et gyldig beløp');
            return;
        }

        if (this.state.accounts[fromAccount].balance < amount) {
            alert('Ikke nok dekning på konto');
            return;
        }

        // Deduct money
        this.state.accounts[fromAccount].balance -= amount;
        
        // If sending to own account (Konto 2), add it there
        if (this.state.accounts[toAccount]) {
            this.state.accounts[toAccount].balance += amount;
        }
        
        this.calculateTotalBalance();
        
        // Add fake transaction
        this.state.accounts[fromAccount].transactions.unshift({
            name: this.state.accounts[toAccount] ? this.state.accounts[toAccount].name : 'Betaling',
            date: this.state.paymentState.date,
            amount: -amount,
            reserved: false,
            icon: 'savings'
        });

        // Also add to receiving account if it exists
        if (this.state.accounts[toAccount]) {
             this.state.accounts[toAccount].transactions.unshift({
                name: 'Fra ' + this.state.accounts[fromAccount].name,
                date: this.state.paymentState.date,
                amount: amount,
                reserved: false,
                icon: 'savings'
            });
        }

        // Update UI
        this.saveState();
        this.updateUI();
        
        // Show Success View
        this.navigateTo('view-pay-success');
        
        // Reset input
        amountInput.value = '1';

        // Trigger feedback modal after a short delay
        setTimeout(() => {
            document.getElementById('feedback-modal').classList.remove('hidden');
        }, 1500);
    },

    closeSuccess: function() {
        // Go back to where we came from, or Home
        this.changeView('view-hjem');
    },

    closeFeedback: function() {
        document.getElementById('feedback-modal').classList.add('hidden');
    },

    updateUI: function() {
        // Update total balance
        document.getElementById('total-balance').innerText = this.formatCurrency(this.state.totalBalance);

        // Update Account Cards (Hjem View)
        // Note: This relies on fixed indices, which is brittle but works for now
        const visaCard = document.querySelector('.account-card:nth-of-type(3)'); // Visakort
        if (visaCard) {
            const balanceEl = visaCard.querySelector('.amount');
            if (balanceEl) balanceEl.innerText = this.formatCurrency(this.state.accounts['21208'].balance);
        }

        const konto2Card = document.querySelector('.account-card:nth-of-type(4)'); // Konto 2
        if (konto2Card) {
            const balanceEl = konto2Card.querySelector('.amount');
            if (balanceEl) balanceEl.innerText = this.formatCurrency(this.state.accounts['1'].balance);
        }

        // Update Savings View
        // Update Total Saved
        const totalSavedEl = document.querySelector('.total-saved .amount-large');
        if (totalSavedEl) {
             const totalSaved = this.state.accounts['2'].balance + this.state.accounts['3'].balance; // Sparekonto + Buffer (Husleie)
             totalSavedEl.innerText = this.formatCurrency(totalSaved).split(',')[0]; // Show whole number for aesthetic
        }
        
        const savingsSummaryEl = document.querySelector('.savings-summary .summary-right span:first-child');
        if (savingsSummaryEl) {
             const totalSaved = this.state.accounts['2'].balance + this.state.accounts['3'].balance;
             savingsSummaryEl.innerText = this.formatCurrency(totalSaved).split(',')[0];
        }

        // Update Sparekonto Card
        const spareCard = document.querySelector('.savings-card:nth-of-type(1)');
        if (spareCard) {
            const progressSpan = spareCard.querySelector('.savings-progress span:first-child');
            if (progressSpan) {
                // Assuming goal is 550 000
                progressSpan.innerText = `${this.formatCurrency(this.state.accounts['2'].balance).split(',')[0]} / 550 000 kr`;
            }
        }

        // Update Husleie (Buffer) Card
        const husleieCard = document.querySelector('.savings-card:nth-of-type(2)');
        if (husleieCard) {
            const progressSpan = husleieCard.querySelector('.savings-progress span:first-child');
            if (progressSpan) {
                // Assuming goal is 100 000
                progressSpan.innerText = `${this.formatCurrency(this.state.accounts['3'].balance).split(',')[0]} / 100 000 kr`;
            }
        }

        // Update Payment View Details (Fra/Til dropdowns)
        const fromAcc = this.state.accounts[this.state.paymentState.fromAccount];
        const toAcc = this.state.accounts[this.state.paymentState.toAccount];

        const payFromEl = document.getElementById('pay-from-display');
        if (payFromEl && fromAcc) {
            payFromEl.innerText = `${fromAcc.name} (${this.formatCurrency(fromAcc.balance)})`;
        }
        
        const payToEl = document.getElementById('pay-to-display');
        if (payToEl && toAcc) {
            payToEl.innerText = `${toAcc.name} (${this.formatCurrency(toAcc.balance)})`;
        }
        
        // Update Message and Date
        const msgEl = document.getElementById('pay-msg-display');
        if (msgEl) {
            msgEl.innerText = this.state.paymentState.message || 'Legg til';
            // Change color if set
            msgEl.className = this.state.paymentState.message ? 'value' : 'value text-blue';
        }

        const dateEl = document.getElementById('pay-date-display');
        if (dateEl) {
            dateEl.innerText = this.state.paymentState.date || 'I dag';
        }
    },

    openAccountSelector: function(type) {
        // type is 'from' or 'to'
        this.selectorType = type;
        const list = document.getElementById('account-selector-list');
        list.innerHTML = '';

        Object.keys(this.state.accounts).forEach(accId => {
            const acc = this.state.accounts[accId];
            
            // Optional: Don't show same account in 'to' if selected in 'from'
            // But for simplicity and self-transfer, we allow it, but maybe visually distinguish?
            
            const item = document.createElement('div');
            item.className = 'account-selector-item';
            item.innerHTML = `
                <div>
                    <span class="acc-name">${acc.name}</span>
                    <span class="acc-balance">${this.formatCurrency(acc.balance)}</span>
                </div>
                ${(this.selectorType === 'from' && this.state.paymentState.fromAccount === accId) || 
                  (this.selectorType === 'to' && this.state.paymentState.toAccount === accId) ? 
                  '<span class="material-icons-round text-blue">check</span>' : ''}
            `;
            item.onclick = () => this.selectAccount(accId);
            list.appendChild(item);
        });

        document.getElementById('account-selector-modal').classList.remove('hidden');
    },

    closeAccountSelector: function(event) {
        if (event && event.target !== event.currentTarget && event.target.tagName !== 'BUTTON') return;
        document.getElementById('account-selector-modal').classList.add('hidden');
    },

    selectAccount: function(accId) {
        if (this.selectorType === 'from') {
            this.state.paymentState.fromAccount = accId;
        } else {
            this.state.paymentState.toAccount = accId;
        }
        this.updateUI();
        this.closeAccountSelector();
    },

    formatCurrency: function(value) {
        // Ensure it's a number, fix to 2 decimals
        const num = Number(value);
        if (isNaN(num)) return "0,00";
        
        // Convert to string with 2 decimals
        const parts = num.toFixed(2).split('.');
        
        // Format integer part with spaces
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        
        // Join with comma
        return parts.join(',');
    },

    updateBalances: function() {
        const bal1 = parseFloat(document.getElementById('admin-balance-1').value);
        const bal2 = parseFloat(document.getElementById('admin-balance-2').value);

        if (!isNaN(bal1)) {
            this.state.accounts['21208'].balance = bal1;
        }
        if (!isNaN(bal2)) {
            this.state.accounts['1'].balance = bal2;
        }
        
        // Update Total Balance (simple sum for now)
        this.state.totalBalance = (this.state.accounts['21208'].balance + this.state.accounts['1'].balance);

        this.saveState();
        this.updateUI();
        alert('Saldo oppdatert!');
        this.goBack();
    },

    startLogin: function() {
        // No animation, immediate login
        document.getElementById('login-state-initial').classList.add('hidden');
        
        // Clear history and go to home
        this.state.historyStack = [];
        this.changeView('view-hjem');

        // Reset login screen for next time (in case of logout)
        setTimeout(() => {
             document.getElementById('login-state-initial').classList.remove('hidden');
        }, 500);
    },

    logout: function() {
        this.state.historyStack = [];
        this.changeView('view-login');
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
