// ResumeAI Scanner Application

// PDF.js worker now configured in pdfHandler.js

// Function to check if user has PRO access
function checkProAccess() {
    // Get user email (in a real app, this would come from authentication)
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
    
    // Check if PRO was directly set in localStorage (for backward compatibility)
    // For the site owner, automatically grant PRO access
    const siteOwner = localStorage.getItem('adminEmail');
    const currentUser = localStorage.getItem('userEmail');
    if (siteOwner && currentUser && siteOwner === currentUser) {
        return true;
    }
    
    return localStorage.getItem('proUser') === 'true';
}

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const scanForm = document.getElementById('scanForm');
    const resumeFileInput = document.getElementById('resumeFile');
    const queryPromptInput = document.getElementById('queryPrompt');
    const scanButton = document.getElementById('scanButton');
    const resultsSection = document.getElementById('results');
    const matchDetailsElement = document.getElementById('matchDetails');
    const aiInsightsElement = document.getElementById('aiInsights');
    const queryResultElement = document.getElementById('queryResult');
    const saveResultBtn = document.getElementById('saveResultBtn');
    
    // Login Elements
    const userLoginBtn = document.getElementById('userLoginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginForm = document.getElementById('loginForm');
    const loginEmail = document.getElementById('loginEmail');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    const currentUserEmail = document.getElementById('currentUserEmail');
    const adminNavItem = document.getElementById('adminNavItem');
    const proStatusBadge = document.getElementById('proStatusBadge');
    
    // Global variables
    let currentScanData = null;
    let scanHistory = JSON.parse(localStorage.getItem('scanHistory')) || [];
    let scanCount = parseInt(localStorage.getItem('dailyScanCount') || '0');
    let lastScanDate = localStorage.getItem('lastScanDate');
    const today = new Date().toDateString();
    
    // Reset scan count if it's a new day
    if (lastScanDate !== today) {
        scanCount = 0;
        localStorage.setItem('dailyScanCount', '0');
        localStorage.setItem('lastScanDate', today);
    }
    
    // Check if user is PRO based on our access control
    let isPro = checkProAccess();
    
    // Event Listeners
    if (scanForm) {
        scanForm.addEventListener('submit', handleScanSubmit);
    }
    
    if (saveResultBtn) {
        saveResultBtn.addEventListener('click', saveResult);
    }
    
    // Login/logout event listeners
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (userLoginBtn) {
        userLoginBtn.addEventListener('click', handleUserLoginClick);
    }
    
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', handleLogout);
    }
    
    // Initialize user state
    initUserState();
    
    // User login/logout functions
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
                isPro = checkProAccess();
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
        const userEmail = localStorage.getItem('userEmail');
        
        if (userEmail) {
            // User is logged in, show logout modal
            if (currentUserEmail) {
                currentUserEmail.textContent = userEmail;
            }
            
            const logoutModal = new bootstrap.Modal(document.getElementById('logoutModal'));
            logoutModal.show();
        } else {
            // User is not logged in, login modal will be shown by data-bs-toggle
        }
    }
    
    function handleLogin(e) {
        e.preventDefault();
        
        const email = loginEmail.value;
        
        if (email) {
            // Store the email
            localStorage.setItem('userEmail', email);
            
            // Check if this is the first login and set as admin
            if (!localStorage.getItem('adminEmail')) {
                localStorage.setItem('adminEmail', email);
                // Also set PRO for admin
                localStorage.setItem('proUser', 'true');
            }
            
            // Hide modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            if (modal) {
                modal.hide();
            }
            
            // Update user state
            initUserState();
            
            // Update PRO status
            isPro = checkProAccess();
            
            // Show welcome message
            alert(`Welcome, ${email}!`);
        }
    }
    
    function handleLogout() {
        // Remove user email
        localStorage.removeItem('userEmail');
        
        // Hide modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('logoutModal'));
        if (modal) {
            modal.hide();
        }
        
        // Update user state
        initUserState();
        
        // Update PRO status
        isPro = checkProAccess();
        
        // Show logged out message
        alert('You have been logged out.');
    }
    
    // Handle scan form submission
    function handleScanSubmit(e) {
        e.preventDefault();
        
        // Validate form inputs
        if (!resumeFileInput.files.length) {
            alert('Please upload a resume file');
            return;
        }
        
        if (!queryPromptInput.value.trim()) {
            alert('Please enter a query prompt');
            return;
        }
        
        // Check scan limits for free users
        if (!isPro && scanCount >= 3) {
            alert('You have reached your daily scan limit. Please upgrade to PRO for unlimited scans.');
            return;
        }
        
        // Show loading state
        scanButton.disabled = true;
        scanButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Scanning...';
        
        // In a real application, you would upload the file and send the query to your backend
        // For this demo, we'll simulate the API call with a timeout
        setTimeout(() => {
            processResume(resumeFileInput.files[0], queryPromptInput.value);
        }, 2000);
    }
    
    // Process resume with query
    function processResume(resumeFile, queryPrompt) {
        // Increment scan count for free users
        if (!isPro) {
            scanCount++;
            localStorage.setItem('dailyScanCount', scanCount.toString());
            localStorage.setItem('lastScanDate', today);
        }
        
        const fileName = resumeFile.name;
        const fileSize = resumeFile.size;
        const fileType = resumeFile.type;
        
        // Show loading state
        scanButton.disabled = true;
        scanButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Scanning...';
        
        // Check if it's a PDF file
        if (fileType === 'application/pdf') {
            processPDFFile(resumeFile, fileName, fileSize, queryPrompt);
        } else {
            // Process as text file
            processTextFile(resumeFile, fileName, fileSize, queryPrompt);
        }
    }
    
    // Process PDF file with our improved PDFHandler
    function processPDFFile(file, fileName, fileSize, queryPrompt) {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                // Check if our PDFHandler is available
                if (typeof window.PDFHandler === 'undefined') {
                    console.error('PDFHandler not loaded');
                    alert('PDF processing library not available. Please check your internet connection and try again.');
                    scanButton.disabled = false;
                    scanButton.innerHTML = '<i class="fas fa-search me-1"></i> Scan Resume';
                    return;
                }
                
                console.log('Processing PDF file using PDFHandler...');
                
                // Extract text from PDF using our specialized handler
                const pdfResult = await window.PDFHandler.extractText(e.target.result);
                
                if (!pdfResult.success) {
                    console.error('PDF extraction failed:', pdfResult.error);
                    
                    // Show user-friendly error
                    const errorResult = {
                        fileName: fileName,
                        fileSize: fileSize,
                        timestamp: new Date().toISOString(),
                        queryPrompt: queryPrompt,
                        matchScore: 0,
                        matchingSkills: [],
                        missingSkills: [],
                        candidateName: "PDF Processing Issue",
                        candidateEmail: "Unknown",
                        candidatePhone: "Unknown",
                        yearsOfExperience: 0,
                        queryResponse: `<strong>Your PDF could not be processed</strong><br><br>
                            This usually happens when:
                            <ul>
                                <li>The PDF contains scanned images instead of actual text</li>
                                <li>The PDF has security restrictions that prevent text extraction</li>
                                <li>The PDF uses custom fonts that aren't properly embedded</li>
                            </ul>
                            <p>Try these solutions:</p>
                            <ol>
                                <li>Convert your PDF to a Word document using an online converter, then save as PDF again</li>
                                <li>Use a plain text (.txt) version of your resume instead</li>
                                <li>Make sure your PDF has selectable text (you can test this by trying to select text in your PDF viewer)</li>
                            </ol>`,
                        insights: ["Unable to process this PDF file.", "Try using a text-based PDF format or .docx file instead."]
                    };
                    
                    // Show the error
                    currentScanData = errorResult;
                    displayResults(errorResult);
                    scanButton.disabled = false;
                    scanButton.innerHTML = '<i class="fas fa-search me-1"></i> Scan Resume';
                    return;
                }
                
                // Success! We have extracted text
                console.log(`Successfully extracted text from PDF: ${pdfResult.text.length} chars`);
                
                try {
                    // Call the AI service to analyze the resume
                    const aiAnalysisResult = await window.AIService.analyzeResume(
                        pdfResult.text,
                        queryPrompt
                    );
                    
                    // Check if analysis failed
                    if (aiAnalysisResult.analysisError) {
                        // If analysis failed, don't perform ATS analysis
                        const resultData = {
                            fileName: fileName,
                            fileSize: fileSize,
                            timestamp: new Date().toISOString(),
                            queryPrompt: queryPrompt,
                            ...aiAnalysisResult, // Spread the AI analysis results
                            analysisError: true
                        };
                        
                        // Store current scan data
                        currentScanData = resultData;
                        
                        // Display error results
                        displayResults(resultData);
                        return;
                    }
                    
                    // If analysis successful, perform ATS compatibility analysis
                    const atsAnalysisResult = await window.AIService.analyzeATSCompatibility(
                        pdfResult.text
                    );
                    
                    // Create the complete result object
                    const resultData = {
                        fileName: fileName,
                        fileSize: fileSize,
                        timestamp: new Date().toISOString(),
                        queryPrompt: queryPrompt,
                        ...aiAnalysisResult, // Spread the AI analysis results
                        ats: atsAnalysisResult // Add ATS analysis results
                    };
                    
                    // Store current scan data
                    currentScanData = resultData;
                    
                    // Display results
                    displayResults(resultData);
                } catch (error) {
                    console.error('Error analyzing resume:', error);
                    alert('There was an error analyzing your resume. Please try again.');
                }
            } catch (error) {
                console.error('Error in PDF processing:', error);
                alert('Error processing the PDF file. Please try again with a different file format.');
            } finally {
                // Reset form state
                scanButton.disabled = false;
                scanButton.innerHTML = '<i class="fas fa-search me-1"></i> Scan Resume';
            }
        };
        
        reader.onerror = function() {
            alert('Error reading the file. Please try again.');
            scanButton.disabled = false;
            scanButton.innerHTML = '<i class="fas fa-search me-1"></i> Scan Resume';
        };
        
        // Read the file as an array buffer (for binary data like PDFs)
        reader.readAsArrayBuffer(file);
    }
    
    // Process text file (DOCX, TXT, etc)
    function processTextFile(file, fileName, fileSize, queryPrompt) {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                // Get resume text content
                const resumeText = e.target.result;
                
                console.log('Processing text file...', fileName);
                console.log(`Text file content length: ${resumeText.length} chars`);
                
                // Call the AI service to analyze the resume
                const aiAnalysisResult = await window.AIService.analyzeResume(
                    resumeText, 
                    queryPrompt
                );
                
                // Check if analysis failed
                if (aiAnalysisResult.analysisError) {
                    // If analysis failed, don't perform ATS analysis
                    const resultData = {
                        fileName: fileName,
                        fileSize: fileSize,
                        timestamp: new Date().toISOString(),
                        queryPrompt: queryPrompt,
                        ...aiAnalysisResult, // Spread the AI analysis results
                        analysisError: true
                    };
                    
                    // Store current scan data
                    currentScanData = resultData;
                    
                    // Display error results
                    displayResults(resultData);
                    return;
                }
                
                // If analysis successful, perform ATS compatibility analysis
                const atsAnalysisResult = await window.AIService.analyzeATSCompatibility(
                    resumeText
                );
                
                // Create the complete result object
                const resultData = {
                    fileName: fileName,
                    fileSize: fileSize,
                    timestamp: new Date().toISOString(),
                    queryPrompt: queryPrompt,
                    ...aiAnalysisResult, // Spread the AI analysis results
                    ats: atsAnalysisResult // Add ATS analysis results
                };
                
                // Store current scan data
                currentScanData = resultData;
                
                // Display results
                displayResults(resultData);
            } catch (error) {
                console.error('Error processing text file:', error);
                alert('There was an error processing your resume. Please try again.');
            } finally {
                // Reset form state
                scanButton.disabled = false;
                scanButton.innerHTML = '<i class="fas fa-search me-1"></i> Scan Resume';
            }
        };
        
        reader.onerror = function() {
            alert('Error reading the file. Please try again.');
            scanButton.disabled = false;
            scanButton.innerHTML = '<i class="fas fa-search me-1"></i> Scan Resume';
        };
        
        // Read as text for non-PDF files
        reader.readAsText(file);
    }
    
    // Display results on the page
    function displayResults(data) {
        // Show results section
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        // Check if analysis encountered an error
        if (data.analysisError) {
            // Hide ATS score section and other analysis sections if there was an error
            const atsScoreSection = document.querySelector('.card.mt-4.mb-4:nth-of-type(2)');
            if (atsScoreSection) atsScoreSection.style.display = 'none';
            
            // Display query result error message
            if (queryResultElement) {
                queryResultElement.innerHTML = `
                    <div class="alert alert-warning">
                        <strong>Query:</strong> ${data.queryPrompt}<br><br>
                        <strong>Response:</strong> <span class="text-danger">Analysis Problem</span><br>
                        <p>I couldn't properly analyze this resume. This might be due to:</p>
                        <ul>
                            <li>The file format (try using .docx or .txt format)</li>
                            <li>If using PDF, make sure the text is selectable</li>
                            <li>The resume might have unusual formatting</li>
                        </ul>
                        <p>Please try uploading a different version of your resume.</p>
                    </div>
                `;
            }
            
            // Make sure other sections are visible for error display
            const matchDetailsElement = document.getElementById('matchDetails');
            if (matchDetailsElement) {
                matchDetailsElement.innerHTML = '<p class="text-muted">Analysis failed. Please upload a different file format.</p>';
            }
            
            const aiInsightsElement = document.getElementById('aiInsights');
            if (aiInsightsElement) {
                let insightsHTML = '';
                if (data.insights && data.insights.length > 0) {
                    data.insights.forEach(insight => {
                        insightsHTML += `<div class="insight-item"><i class="fas fa-exclamation-triangle text-warning me-2"></i>${insight}</div>`;
                    });
                } else {
                    insightsHTML = '<div class="insight-item"><i class="fas fa-exclamation-triangle text-warning me-2"></i>Resume analysis encountered issues.</div>' +
                                  '<div class="insight-item"><i class="fas fa-exclamation-triangle text-warning me-2"></i>Try using a different file format or a text-based version.</div>';
                }
                aiInsightsElement.innerHTML = insightsHTML;
            }
            
            return;
        }
        
        // If no error, continue with normal display
        // Display ATS results if available
        if (data.ats) {
            displayATSResults(data.ats);
        } else {
            // Hide ATS section if no data available
            const atsScoreSection = document.querySelector('.card.mt-4.mb-4:nth-of-type(2)');
            if (atsScoreSection) atsScoreSection.style.display = 'none';
        }
        
        // Display skills
        let matchDetailsHTML = '<h5>Skills Found in Resume</h5><div class="d-flex flex-wrap mb-3">';
        
        if (data.matchingSkills && data.matchingSkills.length > 0) {
            data.matchingSkills.forEach(skill => {
                matchDetailsHTML += `<span class="badge badge-match m-1 p-2">${skill}</span>`;
            });
        } else {
            matchDetailsHTML += '<p class="text-muted">No specific skills were detected in this resume.</p>';
        }
        
        matchDetailsHTML += '</div>';
        
        matchDetailsElement.innerHTML = matchDetailsHTML;
        
        // Display AI insights
        let insightsHTML = '';
        data.insights.forEach(insight => {
            insightsHTML += `<div class="insight-item"><i class="fas fa-lightbulb text-warning me-2"></i>${insight}</div>`;
        });
        
        aiInsightsElement.innerHTML = insightsHTML;
        
        // Display query result if provided
        if (data.queryPrompt && data.queryResponse) {
            queryResultElement.innerHTML = `
                <div class="alert alert-info">
                    <strong>Query:</strong> ${data.queryPrompt}<br><br>
                    <strong>Response:</strong> ${data.queryResponse}
                </div>
            `;
        } else {
            queryResultElement.innerHTML = `
                <div class="alert alert-light">
                    No specific query was provided. Ask a question in the query prompt field for specific information.
                </div>
            `;
        }
    }
    
    // Display ATS analysis results
    function displayATSResults(atsData) {
        // Get ATS display elements
        const atsScoreBadge = document.getElementById('atsScoreBadge');
        const atsScoreBar = document.getElementById('atsScoreBar');
        const keywordScore = document.getElementById('keywordScore');
        const formattingScore = document.getElementById('formattingScore');
        const contactScore = document.getElementById('contactScore');
        const atsImprovementTips = document.getElementById('atsImprovementTips');
        
        // Update ATS score
        if (atsScoreBadge) atsScoreBadge.textContent = atsData.atsScore;
        
        // Update progress bar
        if (atsScoreBar) {
            atsScoreBar.style.width = `${atsData.atsScore}%`;
            atsScoreBar.textContent = `${atsData.atsScore}%`;
            atsScoreBar.setAttribute('aria-valuenow', atsData.atsScore);
            
            // Change progress bar color based on score
            if (atsData.atsScore >= 80) {
                atsScoreBar.className = 'progress-bar bg-success';
            } else if (atsData.atsScore >= 60) {
                atsScoreBar.className = 'progress-bar bg-info';
            } else if (atsData.atsScore >= 40) {
                atsScoreBar.className = 'progress-bar bg-warning';
            } else {
                atsScoreBar.className = 'progress-bar bg-danger';
            }
        }
        
        // Update component scores
        if (keywordScore) keywordScore.textContent = atsData.keywordScore;
        if (formattingScore) formattingScore.textContent = atsData.formattingScore;
        if (contactScore) contactScore.textContent = atsData.contactInfoScore;
        
        // Display improvement tips
        if (atsImprovementTips && atsData.improvementTips) {
            let tipsHTML = '';
            atsData.improvementTips.forEach(tip => {
                tipsHTML += `<li class="list-group-item"><i class="fas fa-check-circle text-primary me-2"></i>${tip}</li>`;
            });
            atsImprovementTips.innerHTML = tipsHTML;
        }
    }
    
    // Save current result to history
    function saveResult() {
        if (!currentScanData) return;
        
        // Add to history
        scanHistory.unshift(currentScanData);
        
        // Limit history to 50 items
        if (scanHistory.length > 50) {
            scanHistory.pop();
        }
        
        // Save to local storage
        localStorage.setItem('scanHistory', JSON.stringify(scanHistory));
        
        alert('Result saved to history!');
    }
});