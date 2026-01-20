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
            }
        },
        totalBalance: 21209,
        historyStack: [] // To track navigation
    },

    init: function() {
        this.setupNavigation();
        this.updateUI();
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

    showPaymentModal: function() {
        document.getElementById('payment-modal').classList.remove('hidden');
    },

    hidePaymentModal: function() {
        document.getElementById('payment-modal').classList.add('hidden');
    },

    processPayment: function() {
        // Use the large input for amount
        const amountInput = document.getElementById('pay-amount-large');
        const amount = parseFloat(amountInput.value.replace(/\s/g, '').replace(',', '.'));
        
        // Hardcoded for demo: From Visa (21208) to Spare (1) or vice versa?
        // In the screenshot, "Fra Visakort" is shown.
        const fromAccount = '21208';
        const toAccount = '1'; // Or just "Sparekonto"

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
        
        this.state.totalBalance = Object.values(this.state.accounts).reduce((sum, acc) => sum + acc.balance, 0);
        
        // Add fake transaction
        this.state.accounts[fromAccount].transactions.unshift({
            name: 'Sparekonto', // Hardcoded for this view
            date: 'I dag',
            amount: -amount,
            reserved: false,
            icon: 'savings'
        });

        // Also add to receiving account if it exists
        if (this.state.accounts[toAccount]) {
             this.state.accounts[toAccount].transactions.unshift({
                name: 'Fra Visakort',
                date: 'I dag',
                amount: amount,
                reserved: false,
                icon: 'savings'
            });
        }

        // Update UI
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

        // Update specific account cards (hardcoded selection for this demo)
        const visaCard = document.querySelector('.account-card:nth-of-type(3)'); // Visakort
        if (visaCard) {
            const balanceEl = visaCard.querySelector('.amount');
            balanceEl.innerText = this.formatCurrency(this.state.accounts['21208'].balance);
        }

        const konto2Card = document.querySelector('.account-card:nth-of-type(4)'); // Konto 2
        if (konto2Card) {
            const balanceEl = konto2Card.querySelector('.amount');
            balanceEl.innerText = this.formatCurrency(this.state.accounts['1'].balance);
        }

        // Update Payment View Details (Fra/Til dropdowns)
        const payFromEl = document.getElementById('pay-from-display');
        if (payFromEl) {
            // Reconstruct the text: "Name (Balance)"
            payFromEl.innerText = `${this.state.accounts['21208'].name} (${this.formatCurrency(this.state.accounts['21208'].balance)})`;
        }
        const payToEl = document.getElementById('pay-to-display');
        if (payToEl) {
            payToEl.innerText = `${this.state.accounts['1'].name} (${this.formatCurrency(this.state.accounts['1'].balance)})`;
        }
    },

    formatCurrency: function(value) {
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
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
