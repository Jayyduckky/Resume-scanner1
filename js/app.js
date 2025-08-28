// ResumeAI Scanner Application

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const scanForm = document.getElementById('scanForm');
    const resumeFileInput = document.getElementById('resumeFile');
    const queryPromptInput = document.getElementById('queryPrompt');
    const scanButton = document.getElementById('scanButton');
    const resultsSection = document.getElementById('results');
    const matchScoreElement = document.getElementById('matchScore');
    const matchDetailsElement = document.getElementById('matchDetails');
    const aiInsightsElement = document.getElementById('aiInsights');
    const queryResultElement = document.getElementById('queryResult');
    const saveResultBtn = document.getElementById('saveResultBtn');
    
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
    
    // Check if user is PRO (in a real app, this would be handled by server authentication)
    const isPro = localStorage.getItem('proUser') === 'true';
    
    // Event Listeners
    if (scanForm) {
        scanForm.addEventListener('submit', handleScanSubmit);
    }
    
    if (saveResultBtn) {
        saveResultBtn.addEventListener('click', saveResult);
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
        
        // Read the resume file
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            // Get resume text content
            const resumeText = e.target.result;
            const fileName = resumeFile.name;
            const fileSize = resumeFile.size;
            
            try {
                // Call the AI service to analyze the resume
                // In a production app, this would send the data to your backend
                // which would then call the OpenAI API
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
                console.error('Error processing resume:', error);
                alert('There was an error processing your resume. Please try again.');
            } finally {
                // Reset form state
                scanButton.disabled = false;
                scanButton.innerHTML = '<i class="fas fa-search me-1"></i> Scan Resume';
            }
        };
        
        reader.onerror = function() {
            alert('Error reading the resume file. Please try again.');
            scanButton.disabled = false;
            scanButton.innerHTML = '<i class="fas fa-search me-1"></i> Scan Resume';
        };
        
        // Start reading the file as text
        reader.readAsText(resumeFile);
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
    
    // Initialize PRO features check
    function initProFeaturesCheck() {
        // This is just for demo purposes
        // In a real application, you would check user status from your server
        const proStatusDisplay = document.getElementById('proStatusDisplay');
        if (proStatusDisplay) {
            if (isPro) {
                proStatusDisplay.innerHTML = '<span class="badge bg-success">PRO</span>';
            } else {
                proStatusDisplay.innerHTML = '<span class="badge bg-secondary">FREE</span>';
            }
        }
    }
    
    // Initialize
    initProFeaturesCheck();
});
