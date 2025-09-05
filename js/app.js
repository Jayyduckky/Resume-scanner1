// ResumeAI Scanner Application

// Set up PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
    // Use the worker from CDN (already loaded separately in HTML)
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    console.log('PDF.js worker configured');
}

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
    
    // Process PDF file
    function processPDFFile(file, fileName, fileSize, queryPrompt) {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                // Check if PDF.js is available
                if (typeof pdfjsLib === 'undefined') {
                    console.error('PDF.js library not loaded');
                    alert('PDF processing library not available. Please check your internet connection and try again.');
                    scanButton.disabled = false;
                    scanButton.innerHTML = '<i class="fas fa-search me-1"></i> Scan Resume';
                    return;
                }
                
                console.log('Processing PDF file...');
                
                // Initialize PDF.js with explicit options for better compatibility
                const typedArray = new Uint8Array(e.target.result);
                const loadingTask = pdfjsLib.getDocument({
                    data: typedArray,
                    nativeImageDecoderSupport: 'display',
                    isEvalSupported: true,
                    disableFontFace: false
                });
                
                loadingTask.promise.then(async function(pdf) {
                    console.log(`PDF loaded successfully. Pages: ${pdf.numPages}`);
                    let fullText = '';
                    
                    try {
                        // Extract text from all pages with additional error handling
                        for (let i = 1; i <= pdf.numPages; i++) {
                            console.log(`Processing page ${i}/${pdf.numPages}`);
                            try {
                                const page = await pdf.getPage(i);
                                const textContent = await page.getTextContent();
                                const pageText = textContent.items.map(item => item.str).join(' ');
                                fullText += pageText + ' ';
                                console.log(`Page ${i} text length: ${pageText.length} chars`);
                            } catch (pageError) {
                                console.error(`Error processing page ${i}:`, pageError);
                                // Continue with other pages even if one fails
                            }
                        }
                        
                        // If we couldn't extract any text, try a fallback approach
                        if (!fullText.trim()) {
                            console.log('No text extracted from PDF, trying alternative approach');
                            // For some PDFs, we might need to try a different approach
                            fullText = "This resume appears to be image-based or using non-standard fonts. " +
                                      "Please try uploading a text-based PDF or a DOCX file for better results.";
                        }
                    
                    } catch (textExtractionError) {
                        console.error('Error extracting text from PDF:', textExtractionError);
                        fullText = "Error extracting text from PDF. This may be due to the PDF structure or security settings.";
                    }
                    
                    console.log(`Total text extracted from PDF: ${fullText.length} chars`);
                    console.log('Sample text:', fullText.substring(0, 100) + '...');
                    
                    try {
                        // Call the AI service to analyze the resume
                        const aiAnalysisResult = await window.AIService.analyzeResume(
                            fullText,
                            queryPrompt
                        );
                        
                        // Create the complete result object
                        const resultData = {
                            fileName: fileName,
                            fileSize: fileSize,
                            timestamp: new Date().toISOString(),
                            queryPrompt: queryPrompt,
                            ...aiAnalysisResult // Spread the AI analysis results
                        };
                        
                        // Store current scan data
                        currentScanData = resultData;
                        
                        // Display results
                        displayResults(resultData);
                    } catch (error) {
                        console.error('Error analyzing resume:', error);
                        alert('There was an error analyzing your resume. Please try again.');
                    } finally {
                        // Reset form state
                        scanButton.disabled = false;
                        scanButton.innerHTML = '<i class="fas fa-search me-1"></i> Scan Resume';
                    }
                }).catch(function(error) {
                    console.error('Error parsing PDF:', error);
                    
                    // Try a fallback approach for PDF extraction
                    console.log('Attempting fallback PDF extraction method...');
                    
                    // In a production app, you might use a server-side PDF extraction service here
                    // For now, we'll create a custom error message with troubleshooting tips
                    
                    // Show detailed error in results section for better debugging
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
                        queryResponse: `We're having trouble processing this particular PDF file. This could be due to:
                            <ul>
                                <li>The PDF contains only images/scanned content</li>
                                <li>The PDF uses custom fonts that aren't embedded</li>
                                <li>The PDF has security restrictions</li>
                            </ul>
                            <p>Try converting your PDF to text format using an online PDF to DOC converter, or try a different PDF.</p>`,
                        insights: ["PDF parsing issue detected. For best results, use text-based PDFs without security restrictions."]
                    };
                    
                    // Store and display the error result
                    currentScanData = errorResult;
                    displayResults(errorResult);
                    
                    // Reset form state
                    scanButton.disabled = false;
                    scanButton.innerHTML = '<i class="fas fa-search me-1"></i> Scan Resume';
                });
            } catch (error) {
                console.error('Error loading PDF:', error);
                alert('Error loading the PDF file. Please try again.');
                
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
                
                // Create the complete result object
                const resultData = {
                    fileName: fileName,
                    fileSize: fileSize,
                    timestamp: new Date().toISOString(),
                    queryPrompt: queryPrompt,
                    ...aiAnalysisResult // Spread the AI analysis results
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