// History page functionality for ResumeAI Scanner

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const historyTableBody = document.getElementById('historyTableBody');
    const emptyHistory = document.getElementById('emptyHistory');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const historyDetailsModal = document.getElementById('historyDetailsModal');
    const historyDetailsContent = document.getElementById('historyDetailsContent');
    
    // Login Elements
    const userLoginBtn = document.getElementById('userLoginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const adminNavItem = document.getElementById('adminNavItem');
    const proStatusBadge = document.getElementById('proStatusBadge');
    
    // Load history data from local storage
    let scanHistory = JSON.parse(localStorage.getItem('scanHistory')) || [];
    
    // Check if user is PRO
    const isPro = checkProAccess();
    
    // Initialize user state
    initUserState();
    
    // Initialize PRO status display
    updateProStatus();
    
    // Display history
    displayHistory();
    
    // Event listeners
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearHistory);
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
        } else {
            // No user logged in
            if (loginBtnText) {
                loginBtnText.textContent = 'Login';
            }
            if (adminNavItem) {
                adminNavItem.style.display = 'none';
            }
        }
    }
    
    function handleUserLoginClick() {
        window.location.href = 'index.html'; // Redirect to index page for login
    }
    
    function updateProStatus() {
        if (proStatusBadge) {
            proStatusBadge.style.display = isPro ? 'inline-block' : 'none';
        }
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
    
    function displayHistory() {
        if (scanHistory.length === 0) {
            // Show empty state
            if (emptyHistory) {
                emptyHistory.classList.remove('d-none');
            }
            if (historyTableBody) {
                historyTableBody.innerHTML = '';
            }
            if (clearHistoryBtn) {
                clearHistoryBtn.disabled = true;
            }
            return;
        }
        
        // Hide empty state
        if (emptyHistory) {
            emptyHistory.classList.add('d-none');
        }
        if (clearHistoryBtn) {
            clearHistoryBtn.disabled = false;
        }
        
        // Generate table rows
        if (historyTableBody) {
            let tableHTML = '';
            
            scanHistory.forEach((item, index) => {
                // Format date
                const date = new Date(item.timestamp);
                const formattedDate = date.toLocaleString();
                
                // Truncate query if needed
                let displayQuery = item.queryPrompt || 'No query';
                if (displayQuery.length > 30) {
                    displayQuery = displayQuery.substring(0, 30) + '...';
                }
                
                // Create table row
                tableHTML += `
                    <tr>
                        <td>${formattedDate}</td>
                        <td>${item.fileName}</td>
                        <td>${item.candidateName}</td>
                        <td>${displayQuery}</td>
                        <td>
                            <button class="btn btn-sm btn-primary view-details" data-index="${index}" data-bs-toggle="modal" data-bs-target="#historyDetailsModal">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            historyTableBody.innerHTML = tableHTML;
            
            // Add event listeners to view buttons
            const viewButtons = document.querySelectorAll('.view-details');
            viewButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'));
                    showHistoryDetails(index);
                });
            });
        }
    }
    
    // Show history item details in modal
    function showHistoryDetails(index) {
        if (!historyDetailsContent || index >= scanHistory.length) return;
        
        const item = scanHistory[index];
        const date = new Date(item.timestamp);
        const formattedDate = date.toLocaleString();
        
        // Handle display formatting
        
        // Generate skills HTML
        let matchingSkillsHTML = '';
        if (item.matchingSkills && item.matchingSkills.length > 0) {
            item.matchingSkills.forEach(skill => {
                matchingSkillsHTML += `<span class="badge badge-match m-1 p-2">${skill}</span>`;
            });
        } else {
            matchingSkillsHTML = '<span class="text-muted">No skills found in resume</span>';
        }
        
        // We're no longer using missing skills
        
        // Generate insights HTML
        let insightsHTML = '';
        if (item.insights && item.insights.length > 0) {
            item.insights.forEach(insight => {
                insightsHTML += `<div class="insight-item"><i class="fas fa-lightbulb text-warning me-2"></i>${insight}</div>`;
            });
        } else {
            insightsHTML = '<p class="text-muted">No insights available</p>';
        }
        
        // Generate query response HTML
        let queryHTML = '';
        if (item.queryPrompt && item.queryResponse) {
            queryHTML = `
                <div class="mt-4">
                    <h5>Query Response</h5>
                    <div class="alert alert-info">
                        <strong>Query:</strong> ${item.queryPrompt}<br><br>
                        <strong>Response:</strong> ${item.queryResponse}
                    </div>
                </div>
            `;
        }
        
        // Populate modal with item details
        historyDetailsContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-md-6">
                    <h5>Resume Details</h5>
                    <ul class="list-group">
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            File Name
                            <span>${item.fileName}</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            Scan Date
                            <span>${formattedDate}</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            Email
                            <span>${item.candidateEmail}</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            Phone
                            <span>${item.candidatePhone}</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            Candidate
                            <span>${item.candidateName}</span>
                        </li>
                    </ul>
                </div>
                <div class="col-md-6">
                    <h5>Query</h5>
                    <div class="p-3 bg-light rounded">
                        <div style="max-height: 200px; overflow-y: auto;">
                            ${item.queryPrompt || 'No query provided'}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-12">
                    <h5>Skills Found</h5>
                    <div class="d-flex flex-wrap mb-3">
                        ${matchingSkillsHTML}
                    </div>
                </div>
            </div>
            
            <div class="mt-4">
                <h5>AI Insights</h5>
                ${insightsHTML}
            </div>
            
            ${queryHTML}
        `;
    }
    
    // Clear all history
    function clearHistory() {
        if (confirm('Are you sure you want to clear all scan history? This action cannot be undone.')) {
            scanHistory = [];
            localStorage.setItem('scanHistory', JSON.stringify(scanHistory));
            displayHistory();
        }
    }
});