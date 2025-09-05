// Admin Panel functionality for ResumeAI Scanner

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const adminPanel = document.getElementById('adminPanel');
    const adminPassword = document.getElementById('adminPassword');
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');
    const addUserForm = document.getElementById('addUserForm');
    const userEmail = document.getElementById('userEmail');
    const accessDuration = document.getElementById('accessDuration');
    const proUsersList = document.getElementById('proUsersList');
    const noUsers = document.getElementById('noUsers');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    // Default admin password if not set
    const DEFAULT_PASSWORD = "admin123";
    
    // Storage keys
    const ADMIN_PASSWORD_KEY = 'adminPassword';
    const PRO_USERS_KEY = 'proUsersList';
    const ADMIN_EMAIL_KEY = 'adminEmail';
    
    // Initialize admin status
    initAdminStatus();
    
    // Event listeners
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    if (addUserForm) {
        addUserForm.addEventListener('submit', handleAddUser);
    }
    
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }
    
    // Functions
    function initAdminStatus() {
        // Check if this is first time setup
        if (!localStorage.getItem(ADMIN_PASSWORD_KEY)) {
            // Set default password
            localStorage.setItem(ADMIN_PASSWORD_KEY, DEFAULT_PASSWORD);
            
            // Set admin as PRO (ensuring site owner always has access)
            localStorage.setItem('proUser', 'true');
            
            // Add admin to PRO users list with unlimited access
            const adminEmail = localStorage.getItem('adminEmail');
            if (adminEmail) {
                const adminProUser = {
                    email: adminEmail,
                    addedOn: new Date().toISOString(),
                    expires: 'unlimited'
                };
                const proUsers = getProUsers();
                if (!proUsers.find(u => u.email === adminEmail)) {
                    proUsers.push(adminProUser);
                    localStorage.setItem(PRO_USERS_KEY, JSON.stringify(proUsers));
                }
            }
            
            // Only create empty pro users list if it doesn't exist
            if (!localStorage.getItem(PRO_USERS_KEY)) {
                localStorage.setItem(PRO_USERS_KEY, JSON.stringify([]));
            }
            
            // Check if there's a saved email to set as admin
            // Get admin email (using the variable we already initialized above)
            // const adminEmail = localStorage.getItem(ADMIN_EMAIL_KEY);
            if (!adminEmail) {
                // Save the current session as admin
                localStorage.setItem(ADMIN_EMAIL_KEY, 'admin@example.com');
            }
        }
    }
    
    function handleLogin() {
        const enteredPassword = adminPassword.value;
        const savedPassword = localStorage.getItem(ADMIN_PASSWORD_KEY);
        
        if (enteredPassword === savedPassword) {
            // Hide login form, show admin panel
            loginForm.style.display = 'none';
            adminPanel.style.display = 'block';
            
            // Load the PRO users list
            loadProUsers();
        } else {
            // Show error message
            loginError.style.display = 'block';
            adminPassword.value = '';
        }
    }
    
    function loadProUsers() {
        const proUsers = getProUsers();
        
        // Clear the list
        if (proUsersList) {
            proUsersList.innerHTML = '';
        }
        
        // Show no users message if empty
        if (noUsers) {
            if (proUsers.length === 0) {
                noUsers.style.display = 'block';
            } else {
                noUsers.style.display = 'none';
            }
        }
        
        // Populate the table
        proUsers.forEach(user => {
            const row = document.createElement('tr');
            
            // Format dates
            const addedDate = new Date(user.addedOn).toLocaleDateString();
            let expiryDate = 'Never';
            if (user.expires !== 'unlimited') {
                expiryDate = new Date(user.expires).toLocaleDateString();
            }
            
            row.innerHTML = `
                <td>${user.email}</td>
                <td>${addedDate}</td>
                <td>${expiryDate}</td>
                <td>
                    <button class="btn btn-sm btn-danger remove-user" data-email="${user.email}">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </td>
            `;
            
            if (proUsersList) {
                proUsersList.appendChild(row);
            }
        });
        
        // Add event listeners to remove buttons
        const removeButtons = document.querySelectorAll('.remove-user');
        removeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const email = this.getAttribute('data-email');
                removeProUser(email);
            });
        });
    }
    
    function handleAddUser(e) {
        e.preventDefault();
        
        const email = userEmail.value;
        const duration = accessDuration.value;
        
        // Calculate expiry date
        let expiryDate = 'unlimited';
        if (duration !== 'unlimited') {
            const days = parseInt(duration);
            const date = new Date();
            date.setDate(date.getDate() + days);
            expiryDate = date.toISOString();
        }
        
        // Create user object
        const user = {
            email: email,
            addedOn: new Date().toISOString(),
            expires: expiryDate
        };
        
        // Add to pro users list
        addProUser(user);
        
        // Reset form
        userEmail.value = '';
        
        // Show success message
        alert(`${email} has been added as a PRO user!`);
    }
    
    function handleChangePassword(e) {
        e.preventDefault();
        
        const password = newPassword.value;
        const confirm = confirmPassword.value;
        
        if (password !== confirm) {
            alert('Passwords do not match. Please try again.');
            return;
        }
        
        // Update password
        localStorage.setItem(ADMIN_PASSWORD_KEY, password);
        
        // Reset form
        newPassword.value = '';
        confirmPassword.value = '';
        
        // Show success message
        alert('Admin password has been updated!');
    }
    
    function getProUsers() {
        const usersJson = localStorage.getItem(PRO_USERS_KEY);
        return usersJson ? JSON.parse(usersJson) : [];
    }
    
    function addProUser(user) {
        const users = getProUsers();
        
        // Check if user already exists
        const index = users.findIndex(u => u.email === user.email);
        if (index !== -1) {
            // Update existing user
            users[index] = user;
        } else {
            // Add new user
            users.push(user);
        }
        
        // Save to localStorage
        localStorage.setItem(PRO_USERS_KEY, JSON.stringify(users));
        
        // Refresh the list
        loadProUsers();
    }
    
    function removeProUser(email) {
        const users = getProUsers();
        
        // Filter out the user
        const updatedUsers = users.filter(user => user.email !== email);
        
        // Save to localStorage
        localStorage.setItem(PRO_USERS_KEY, JSON.stringify(updatedUsers));
        
        // Refresh the list
        loadProUsers();
    }
});
