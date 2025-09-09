// Sign up page functionality

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const signupForm = document.getElementById('signupForm');
    const signupError = document.getElementById('signupError');
    const googleSignupBtn = document.getElementById('googleSignup');
    const githubSignupBtn = document.getElementById('githubSignup');
    
    // Toggle password visibility
    window.togglePasswordVisibility = function() {
        const passwordInput = document.getElementById('password');
        const passwordToggle = document.querySelector('.password-toggle i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            passwordToggle.classList.remove('fa-eye');
            passwordToggle.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            passwordToggle.classList.remove('fa-eye-slash');
            passwordToggle.classList.add('fa-eye');
        }
    };
    
    // Toggle confirm password visibility
    window.toggleConfirmPasswordVisibility = function() {
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const confirmPasswordToggle = document.querySelectorAll('.password-toggle i')[1];
        
        if (confirmPasswordInput.type === 'password') {
            confirmPasswordInput.type = 'text';
            confirmPasswordToggle.classList.remove('fa-eye');
            confirmPasswordToggle.classList.add('fa-eye-slash');
        } else {
            confirmPasswordInput.type = 'password';
            confirmPasswordToggle.classList.remove('fa-eye-slash');
            confirmPasswordToggle.classList.add('fa-eye');
        }
    };
    
    // Handle signup form submission
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const termsAgreement = document.getElementById('termsAgreement').checked;
            
            // Validate inputs
            if (!fullName || !email || !password || !confirmPassword) {
                showError('Please fill in all fields');
                return;
            }
            
            if (password !== confirmPassword) {
                showError('Passwords do not match');
                return;
            }
            
            if (password.length < 8) {
                showError('Password must be at least 8 characters long');
                return;
            }
            
            if (!termsAgreement) {
                showError('You must agree to the Terms of Service and Privacy Policy');
                return;
            }
            
            // Show loading state
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Creating account...';
            
            // Simulate signup API request
            setTimeout(() => {
                // In a real app, you would call your registration API here
                // This is a simplified demo that uses localStorage
                
                // Check if user already exists
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const userExists = users.some(user => user.email === email);
                
                if (userExists) {
                    showError('A user with this email already exists');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Sign Up';
                    return;
                }
                
                // Create new user
                const newUser = {
                    fullName,
                    email,
                    password, // WARNING: In a real app, NEVER store passwords in plain text
                    createdAt: new Date().toISOString()
                };
                
                // Add user to local storage
                users.push(newUser);
                localStorage.setItem('users', JSON.stringify(users));
                
                // Set as logged in
                localStorage.setItem('userEmail', email);
                localStorage.setItem('userName', fullName);
                
                // If first user, set as admin
                if (!localStorage.getItem('adminEmail')) {
                    localStorage.setItem('adminEmail', email);
                    // Also set PRO for admin
                    localStorage.setItem('proUser', 'true');
                }
                
                // Redirect to home page
                window.location.href = 'index.html';
                
            }, 1500); // Simulated API delay
        });
    }
    
    // Social signup buttons
    if (googleSignupBtn) {
        googleSignupBtn.addEventListener('click', function() {
            // In a real app, you would implement Google OAuth login here
            alert('Google sign up would be implemented here');
        });
    }
    
    if (githubSignupBtn) {
        githubSignupBtn.addEventListener('click', function() {
            // In a real app, you would implement GitHub OAuth login here
            alert('GitHub sign up would be implemented here');
        });
    }
    
    // Helper functions
    function showError(message) {
        signupError.textContent = message;
        signupError.style.display = 'block';
        
        // Hide error after 5 seconds
        setTimeout(() => {
            signupError.style.display = 'none';
        }, 5000);
    }
    
    // Check if user is already logged in
    function checkLoggedInUser() {
        const userEmail = localStorage.getItem('userEmail');
        
        if (userEmail) {
            // Redirect to home page
            window.location.href = 'index.html';
        }
    }
    
    // Check logged in status on page load
    checkLoggedInUser();
});
