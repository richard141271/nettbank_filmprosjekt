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
        const fromAccount = document.getElementById('pay-from').value;
        const amount = parseFloat(document.getElementById('pay-amount').value);
        const toAccount = document.getElementById('pay-to').value;

        if (!amount || amount <= 0) {
            alert('Vennligst oppgi et gyldig beløp');
            return;
        }

        if (this.state.accounts[fromAccount].balance < amount) {
            alert('Ikke nok dekning på konto');
            return;
        }

        // Simulate processing
        const btn = document.querySelector('.btn-large-primary');
        const originalText = btn.innerText;
        btn.innerText = 'Behandler...';
        btn.style.backgroundColor = '#4cd964'; // Green

        setTimeout(() => {
            // Deduct money
            this.state.accounts[fromAccount].balance -= amount;
            this.state.totalBalance -= amount;
            
            // Add fake transaction
            this.state.accounts[fromAccount].transactions.unshift({
                name: toAccount || 'Ukjent mottaker',
                date: 'I dag',
                amount: -amount,
                reserved: false,
                icon: 'payment'
            });

            // Update UI
            this.updateUI();
            
            // Success state
            btn.innerText = 'Betalt!';
            
            setTimeout(() => {
                this.hidePaymentModal();
                btn.innerText = originalText;
                btn.style.backgroundColor = '';
                document.getElementById('pay-amount').value = '';
                document.getElementById('pay-to').value = '';
                document.getElementById('pay-msg').value = '';
                
                // If we are in account view, refresh it
                if (document.getElementById('view-account-details').classList.contains('active')) {
                    this.openAccount(fromAccount); 
                }
            }, 1000);

        }, 1500);
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
        document.getElementById('login-state-initial').classList.add('hidden');
        const faceIdState = document.getElementById('login-state-faceid');
        faceIdState.classList.remove('hidden');
        
        const icon = faceIdState.querySelector('.face-id-icon');
        icon.classList.add('scanning');

        setTimeout(() => {
            // Success animation/transition
            icon.innerText = 'check_circle';
            icon.style.color = 'var(--accent-green)';
            icon.classList.remove('scanning');
            
            setTimeout(() => {
                 this.changeView('view-hjem');
                 this.state.historyStack = []; // Clear history
                 
                 // Reset login screen for next time
                 setTimeout(() => {
                     document.getElementById('login-state-initial').classList.remove('hidden');
                     faceIdState.classList.add('hidden');
                     icon.innerText = 'face';
                     icon.style.color = 'var(--primary-blue)';
                 }, 500);
            }, 500);
        }, 1500);
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
