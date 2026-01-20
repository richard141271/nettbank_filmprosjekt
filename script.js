const app = {
    state: {
        accounts: {
            '21208': { name: 'Visakort bulder', balance: 21208, spent: 7601 },
            '1': { name: 'Konto 2', balance: 1, spent: 1 }
        },
        totalBalance: 21209
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
            });
        });
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

    // Generic Modal Functions
    showGenericModal: function(title, contentHTML) {
        document.getElementById('generic-title').innerText = title;
        document.getElementById('generic-content').innerHTML = contentHTML;
        document.getElementById('generic-modal').classList.remove('hidden');
    },

    hideGenericModal: function() {
        document.getElementById('generic-modal').classList.add('hidden');
    },

    showForfall: function() {
        const content = `
            <div class="card">
                <div class="section-header">
                    <span>I dag</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <span>Netflix</span>
                    <span class="red-text">-159 kr</span>
                </div>
            </div>
            <div class="card">
                <div class="section-header">
                    <span>Neste uke</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding: 10px 0;">
                    <span>Husleie</span>
                    <span class="red-text">-8 500 kr</span>
                </div>
            </div>
        `;
        this.showGenericModal('Forfallsoversikt', content);
    },

    showFasteOppdrag: function() {
        const content = `
             <div class="card">
                <div style="display:flex; align-items:center; padding: 10px 0;">
                    <div class="account-icon" style="background: rgba(255,255,255,0.1); color: white; margin-right: 15px;">
                        <span class="material-icons-round">home</span>
                    </div>
                    <div>
                        <h3>Husleie</h3>
                        <p>8 500 kr - Den 20. hver måned</p>
                    </div>
                </div>
            </div>
             <div class="card">
                <div style="display:flex; align-items:center; padding: 10px 0;">
                    <div class="account-icon" style="background: rgba(255,255,255,0.1); color: white; margin-right: 15px;">
                        <span class="material-icons-round">savings</span>
                    </div>
                    <div>
                        <h3>Sparing</h3>
                        <p>2 000 kr - Den 12. hver måned</p>
                    </div>
                </div>
            </div>
        `;
        this.showGenericModal('Faste oppdrag', content);
    },

    showMottakere: function() {
        const content = `
            <div class="input-group">
                <input type="text" placeholder="Søk etter mottaker">
            </div>
            <div class="card">
                <div style="padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">Mamma</div>
                <div style="padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">Pappa</div>
                <div style="padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">Huseier</div>
                <div style="padding: 15px 0;">Strømleverandør AS</div>
            </div>
        `;
        this.showGenericModal('Mottakere', content);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
