// Pricing page functionality for ResumeAI Scanner

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const subscribeMonthlyBtn = document.getElementById('subscribeMonthlyBtn');
    const subscribeAnnualBtn = document.getElementById('subscribeAnnualBtn');
    const paymentModal = document.getElementById('paymentModal');
    const paymentDetails = document.getElementById('paymentDetails');
    const paymentSuccess = document.getElementById('paymentSuccess');
    const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
    
    // Login Elements
    const userLoginBtn = document.getElementById('userLoginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const adminNavItem = document.getElementById('adminNavItem');
    const proStatusBadge = document.getElementById('proStatusBadge');
    
    // Track subscription type
    let selectedPlan = '';
    
    // Check if user is already PRO
    const isPro = checkProAccess();
    
    // Initialize user state
    initUserState();
    
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
    
    if (userLoginBtn) {
        userLoginBtn.addEventListener('click', handleUserLoginClick);
    }
    
    // Functions
    function initUserState() {
        const userEmail = localStorage.getItem('userEmail');
        const adminEmail = localStorage.getItem('adminEmail');
        
        if (userEmail) {
            // User is logged in
            if (loginBtnText) {
                loginBtnText.textContent = 'Logout';
            }
            
            // Check if user is admin
            if (userEmail === adminEmail && adminNavItem) {
                adminNavItem.style.display = 'block';
            }
            
            // Check and display PRO status
            if (proStatusBadge) {
                proStatusBadge.style.display = isPro ? 'inline-block' : 'none';
            }
        } else {
            // No user logged in
            if (loginBtnText) {
                loginBtnText.textContent = 'Login';
            }
            if (adminNavItem) {
                adminNavItem.style.display = 'none';
            }
            if (proStatusBadge) {
                proStatusBadge.style.display = 'none';
            }
        }
    }
    
    function handleUserLoginClick() {
        window.location.href = 'index.html'; // Redirect to index page for login
    }
    
    // Check if user has PRO access
    function checkProAccess() {
        // Get user email
        const userEmail = localStorage.getItem('userEmail') || '';
        
        // Check if user is the admin
        const adminEmail = localStorage.getItem('adminEmail');
        if (userEmail === adminEmail) {
            return true;
        }
        
        // Check if the user is in the PRO users list
        const proUsersList = localStorage.getItem('proUsersList');
        if (proUsersList) {
            const proUsers = JSON.parse(proUsersList);
            const userRecord = proUsers.find(user => user.email === userEmail);
            
            if (userRecord) {
                // Check if subscription is still valid
                if (userRecord.expires === 'unlimited') {
                    return true;
                } else {
                    const expiryDate = new Date(userRecord.expires);
                    const now = new Date();
                    return expiryDate > now;
                }
            }
        }
        
        // For the site owner, automatically grant PRO access
        const siteOwner = localStorage.getItem('adminEmail');
        const currentUser = localStorage.getItem('userEmail');
        if (siteOwner && currentUser && siteOwner === currentUser) {
            return true;
        }
        
        // Check if PRO was directly set in localStorage (for backward compatibility)
        return localStorage.getItem('proUser') === 'true';
    }
    
    function showPaymentModal(title, price) {
        if (!paymentModal) return;
        
        // Check if user is logged in first
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
            alert('Please login first before subscribing to PRO!');
            window.location.href = 'index.html'; // Redirect to home page for login
            return;
        }
        
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
        
        // Check if we're using credit card
        const creditCardRadio = document.getElementById('creditCard');
        const isUsingCreditCard = creditCardRadio && creditCardRadio.checked;
        
        if (isUsingCreditCard) {
            // Validate credit card details
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
        }
        
        // Get current user email
        const userEmail = localStorage.getItem('userEmail');
        if (!userEmail) {
            alert('Please login first before subscribing.');
            return;
        }
        
        // Show loading state
        if (confirmPaymentBtn) {
            confirmPaymentBtn.disabled = true;
            confirmPaymentBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
        }
        
        // Calculate expiry date
        let expiryDate = 'unlimited';
        if (selectedPlan === 'monthly') {
            const date = new Date();
            date.setMonth(date.getMonth() + 1);
            expiryDate = date.toISOString();
        } else if (selectedPlan === 'annual') {
            const date = new Date();
            date.setFullYear(date.getFullYear() + 1);
            expiryDate = date.toISOString();
        }
        
        // Create user record for PRO list
        const proUser = {
            email: userEmail,
            addedOn: new Date().toISOString(),
            expires: expiryDate
        };
        
        // Add user to PRO list
        addProUser(proUser);
        
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
        
        // Show PRO badge
        if (proStatusBadge) {
            proStatusBadge.style.display = 'inline-block';
        }
    }
    
    // Payment Method Toggle
    const creditCardRadio = document.getElementById('creditCard');
    const stripeRadio = document.getElementById('stripe');
    const paypalRadio = document.getElementById('paypal');
    const creditCardForm = document.getElementById('creditCardForm');
    const stripeElementsContainer = document.getElementById('stripe-elements-container');
    const paypalButtonContainer = document.getElementById('paypal-button-container');
    
    if (creditCardRadio && stripeRadio && paypalRadio) {
        // Credit Card selected
        creditCardRadio.addEventListener('change', function() {
            if (this.checked) {
                if (creditCardForm) creditCardForm.style.display = 'block';
                if (stripeElementsContainer) stripeElementsContainer.style.display = 'none';
                if (paypalButtonContainer) paypalButtonContainer.style.display = 'none';
                if (confirmPaymentBtn) confirmPaymentBtn.style.display = 'block';
            }
        });
        
        // Stripe selected
        stripeRadio.addEventListener('change', function() {
            if (this.checked) {
                if (creditCardForm) creditCardForm.style.display = 'none';
                if (stripeElementsContainer) stripeElementsContainer.style.display = 'block';
                if (paypalButtonContainer) paypalButtonContainer.style.display = 'none';
                if (confirmPaymentBtn) confirmPaymentBtn.style.display = 'block';
                // Initialize Stripe (not implemented yet)
            }
        });
        
        // PayPal selected
        paypalRadio.addEventListener('change', function() {
            if (this.checked) {
                if (creditCardForm) creditCardForm.style.display = 'none';
                if (stripeElementsContainer) stripeElementsContainer.style.display = 'none';
                if (paypalButtonContainer) paypalButtonContainer.style.display = 'block';
                if (confirmPaymentBtn) confirmPaymentBtn.style.display = 'none'; // Hide the regular payment button
                
                // Initialize PayPal button
                initPayPalButton();
            }
        });
    }
    
    // Add user to PRO users list
    function addProUser(user) {
        // Get existing PRO users list
        let proUsers = [];
        const existingList = localStorage.getItem('proUsersList');
        if (existingList) {
            proUsers = JSON.parse(existingList);
        }
        
        // Check if user already exists
        const index = proUsers.findIndex(u => u.email === user.email);
        if (index !== -1) {
            // Update existing user
            proUsers[index] = user;
        } else {
            // Add new user
            proUsers.push(user);
        }
        
        // Save updated list
        localStorage.setItem('proUsersList', JSON.stringify(proUsers));
    }
    
    // PayPal Button Integration
    function initPayPalButton() {
        // Make sure we have a paypal-button-container
        const paypalButtonContainer = document.getElementById('paypal-button-container');
        if (!paypalButtonContainer) {
            console.error('PayPal button container not found');
            return;
        }
        
        // Clear any existing buttons
        paypalButtonContainer.innerHTML = '';
        
        // Check if the PayPal SDK is loaded
        if (!window.paypal) {
            console.error('PayPal SDK not loaded');
            paypalButtonContainer.innerHTML = '<div class="text-center p-4 border rounded">Loading PayPal button...</div>';
            return;
        }
        
        const amount = selectedPlan === 'monthly' ? '9.99' : '99.00';
        
        // Render the PayPal button
        window.paypal.Buttons({
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
                            value: amount
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
                    
                    // Create user record for PRO list with appropriate expiry date
                    let expiryDate = 'unlimited';
                    if (selectedPlan === 'monthly') {
                        const date = new Date();
                        date.setMonth(date.getMonth() + 1);
                        expiryDate = date.toISOString();
                    } else if (selectedPlan === 'annual') {
                        const date = new Date();
                        date.setFullYear(date.getFullYear() + 1);
                        expiryDate = date.toISOString();
                    }
                    
                    // Add user to PRO list
                    const userEmail = localStorage.getItem('userEmail');
                    if (userEmail) {
                        const proUser = {
                            email: userEmail,
                            addedOn: new Date().toISOString(),
                            expires: expiryDate
                        };
                        addProUser(proUser);
                    }
                    
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
        }).render(paypalButtonContainer);
    }
});