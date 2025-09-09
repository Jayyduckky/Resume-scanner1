// Login page functionality

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const loginForm = document.getElementById('loginForm');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const loginError = document.getElementById('loginError');
    const googleLoginBtn = document.getElementById('googleLogin');
    const githubLoginBtn = document.getElementById('githubLogin');
    
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
    
    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            
            // Validate inputs
            if (!email || !password) {
                showError('Please enter both email and password');
                return;
            }
            
            // Show loading state
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Signing in...';
            
            // Simulate login API request
            setTimeout(() => {
                // In a real app, you would call your authentication API here
                // This is a simplified demo that uses localStorage
                
                // Check if user exists (in real app, this would be a server-side check)
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const user = users.find(u => u.email === email);
                
                if (!user) {
                    showError('User not found. Please check your email or sign up.');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Sign In';
                    return;
                }
                
                // Check password (in real app, this would be done securely on the server)
                // WARNING: This is NOT secure and is only for demonstration purposes
                if (user.password !== password) {
                    showError('Incorrect password. Please try again.');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Sign In';
                    return;
                }
                
                // Login successful
                // Store user info in localStorage
                localStorage.setItem('userEmail', email);
                localStorage.setItem('userName', user.fullName || email);
                
                // Check if user is an admin
                if (!localStorage.getItem('adminEmail')) {
                    localStorage.setItem('adminEmail', email);
                }
                
                if (rememberMe) {
                    localStorage.setItem('rememberUser', 'true');
                } else {
                    localStorage.removeItem('rememberUser');
                }
                
                // Redirect to home page
                window.location.href = 'index.html';
                
            }, 1500); // Simulated API delay
        });
    }
    
    // Handle forgot password link
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Show forgot password modal
            const modal = new bootstrap.Modal(document.getElementById('forgotPasswordModal'));
            modal.show();
        });
    }
    
    // Handle forgot password form
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const email = document.getElementById('resetEmail').value;
            
            // Validate email
            if (!email) {
                // You might want to show an error in the modal
                alert('Please enter your email address');
                return;
            }
            
            // Show loading state
            const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Sending...';
            
            // Simulate API request
            setTimeout(() => {
                // In a real app, you would call your password reset API here
                
                // Hide modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal'));
                modal.hide();
                
                // Show success message
                alert('Password reset link sent to your email address. Please check your inbox.');
                
                // Reset form
                forgotPasswordForm.reset();
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Send Reset Link';
                
            }, 1500); // Simulated API delay
        });
    }
    
    // Social login buttons
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', function() {
            // In a real app, you would implement Google OAuth login here
            alert('Google login would be implemented here');
        });
    }
    
    if (githubLoginBtn) {
        githubLoginBtn.addEventListener('click', function() {
            // In a real app, you would implement GitHub OAuth login here
            alert('GitHub login would be implemented here');
        });
    }
    
    // Helper functions
    function showError(message) {
        loginError.textContent = message;
        loginError.style.display = 'block';
        
        // Hide error after 5 seconds
        setTimeout(() => {
            loginError.style.display = 'none';
        }, 5000);
    }
    
    // Check if user is already logged in
    function checkLoggedInUser() {
        const userEmail = localStorage.getItem('userEmail');
        const rememberUser = localStorage.getItem('rememberUser');
        
        if (userEmail && rememberUser === 'true') {
            // Redirect to home page
            window.location.href = 'index.html';
        }
    }
    
    // Check logged in status on page load
    checkLoggedInUser();
});
