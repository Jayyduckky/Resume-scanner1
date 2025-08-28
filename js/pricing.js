// Pricing page functionality for ResumeAI Scanner

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const subscribeMonthlyBtn = document.getElementById('subscribeMonthlyBtn');
    const subscribeAnnualBtn = document.getElementById('subscribeAnnualBtn');
    const paymentModal = document.getElementById('paymentModal');
    const paymentDetails = document.getElementById('paymentDetails');
    const paymentSuccess = document.getElementById('paymentSuccess');
    const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
    
    // Track subscription type
    let selectedPlan = '';
    
    // Check if user is already PRO
    const isPro = localStorage.getItem('proUser') === 'true';
    
    // Update buttons if user is already PRO
    if (isPro) {
        if (subscribeMonthlyBtn) {
            subscribeMonthlyBtn.innerText = 'Current Plan';
            subscribeMonthlyBtn.disabled = true;
        }
        if (subscribeAnnualBtn) {
            subscribeAnnualBtn.innerText = 'Upgrade';
        }
    }
    
    // Event Listeners
    if (subscribeMonthlyBtn) {
        subscribeMonthlyBtn.addEventListener('click', () => {
            if (!isPro) {
                selectedPlan = 'monthly';
                showPaymentModal('PRO Monthly Subscription', '$9.99/month');
            }
        });
    }
    
    if (subscribeAnnualBtn) {
        subscribeAnnualBtn.addEventListener('click', () => {
            selectedPlan = 'annual';
            showPaymentModal('PRO Annual Subscription', '$99/year');
        });
    }
    
    if (confirmPaymentBtn) {
        confirmPaymentBtn.addEventListener('click', processPayment);
    }
    
    // Functions
    function showPaymentModal(title, price) {
        if (!paymentModal) return;
        
        // Set modal title to show plan details
        const modalTitle = document.getElementById('paymentModalLabel');
        if (modalTitle) {
            modalTitle.textContent = title;
        }
        
        // Initialize payment UI
        if (paymentDetails) paymentDetails.style.display = 'block';
        if (paymentSuccess) paymentSuccess.style.display = 'none';
        if (confirmPaymentBtn) confirmPaymentBtn.style.display = 'block';
        
        // Show the payment modal
        const modalElement = bootstrap.Modal.getOrCreateInstance(paymentModal);
        modalElement.show();
    }
    
    // Process payment function
    function processPayment() {
        // Validate form (simplified for demo)
        const cardName = document.getElementById('cardName');
        const cardNumber = document.getElementById('cardNumber');
        const cardExpiry = document.getElementById('cardExpiry');
        const cardCVC = document.getElementById('cardCVC');
        
        if (cardName && cardName.value.trim() === '') {
            alert('Please enter the name on the card');
            return;
        }
        
        if (cardNumber && cardNumber.value.trim() === '') {
            alert('Please enter the card number');
            return;
        }
        
        if (cardExpiry && cardExpiry.value.trim() === '') {
            alert('Please enter the expiry date');
            return;
        }
        
        if (cardCVC && cardCVC.value.trim() === '') {
            alert('Please enter the CVC');
            return;
        }
        
        // In a real app, this would call a payment processing API
        // For the demo, we'll just simulate a successful payment
        
        // Show loading state
        if (confirmPaymentBtn) {
            confirmPaymentBtn.disabled = true;
            confirmPaymentBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
        }
        
        // Simulate API call delay
        setTimeout(() => {
            // Mark user as PRO in local storage
            localStorage.setItem('proUser', 'true');
            localStorage.setItem('proType', selectedPlan);
            localStorage.setItem('proStartDate', new Date().toISOString());
            
            // Show success message
            if (paymentDetails) paymentDetails.style.display = 'none';
            if (paymentSuccess) paymentSuccess.style.display = 'block';
            if (confirmPaymentBtn) confirmPaymentBtn.style.display = 'none';
            
            // Update UI after successful payment
            updateUIAfterPayment();
            
            // Close modal after a delay
            setTimeout(() => {
                const modalElement = bootstrap.Modal.getInstance(paymentModal);
                if (modalElement) {
                    modalElement.hide();
                    
                    // Redirect to home page
                    window.location.href = 'index.html';
                }
            }, 3000);
        }, 2000);
    }
    
    // Update UI elements after successful payment
    function updateUIAfterPayment() {
        // In a real app, this would refresh the UI to show PRO features
        // For demo purposes, we'll just update the subscription buttons
        if (subscribeMonthlyBtn) {
            if (selectedPlan === 'monthly') {
                subscribeMonthlyBtn.innerText = 'Current Plan';
                subscribeMonthlyBtn.disabled = true;
                subscribeAnnualBtn.innerText = 'Upgrade';
            } else {
                subscribeAnnualBtn.innerText = 'Current Plan';
                subscribeAnnualBtn.disabled = true;
                subscribeMonthlyBtn.innerText = 'Downgrade';
            }
        }
    }
    
    // Payment Method Toggle
    const creditCardRadio = document.getElementById('creditCard');
    const paypalRadio = document.getElementById('paypal');
    const creditCardForm = document.getElementById('creditCardForm');
    
    if (creditCardRadio && paypalRadio && creditCardForm) {
        creditCardRadio.addEventListener('change', function() {
            if (this.checked) {
                creditCardForm.style.display = 'block';
            }
        });
        
        paypalRadio.addEventListener('change', function() {
            if (this.checked) {
                creditCardForm.style.display = 'none';
                // For a real PayPal integration, you would use this code:
                // initPayPalButton();
            }
        });
    }
    
    // PayPal Button Integration
    function initPayPalButton() {
        // This would be your actual PayPal integration
        // You'll need to sign up for a PayPal Developer account
        // and get your client ID
        
        const PAYPAL_CLIENT_ID = 'YOUR_PAYPAL_CLIENT_ID';
        
        paypal.Buttons({
            style: {
                shape: 'rect',
                color: 'blue',
                layout: 'vertical',
                label: 'paypal',
            },
            
            createOrder: function(data, actions) {
                // Set up the transaction details
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            currency_code: 'USD',
                            value: selectedPlan === 'monthly' ? '9.99' : '99.00'
                        },
                        description: selectedPlan === 'monthly' ? 
                            'ResumeAI PRO Monthly Subscription' : 
                            'ResumeAI PRO Annual Subscription'
                    }]
                });
            },
            
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(orderData) {
                    // Process successful payment
                    localStorage.setItem('proUser', 'true');
                    localStorage.setItem('proType', selectedPlan);
                    localStorage.setItem('proStartDate', new Date().toISOString());
                    
                    // Show success message
                    if (paymentDetails) paymentDetails.style.display = 'none';
                    if (paymentSuccess) paymentSuccess.style.display = 'block';
                    if (confirmPaymentBtn) confirmPaymentBtn.style.display = 'none';
                    
                    // Update UI after successful payment
                    updateUIAfterPayment();
                    
                    // Close modal after a delay
                    setTimeout(() => {
                        const modalElement = bootstrap.Modal.getInstance(paymentModal);
                        if (modalElement) {
                            modalElement.hide();
                            
                            // Redirect to home page
                            window.location.href = 'index.html';
                        }
                    }, 3000);
                });
            }
        }).render('#paypal-button-container');
    }
});
