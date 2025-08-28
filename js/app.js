// ResumeAI Scanner Application

// Set up PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js';
}

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
                // Initialize PDF.js
                const typedArray = new Uint8Array(e.target.result);
                const loadingTask = pdfjsLib.getDocument({ data: typedArray });
                
                loadingTask.promise.then(async function(pdf) {
                    let fullText = '';
                    
                    // Extract text from all pages
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        fullText += pageText + ' ';
                    }
                    
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
                    
                    // Show detailed error in results section for better debugging
                    const errorResult = {
                        fileName: fileName,
                        fileSize: fileSize,
                        timestamp: new Date().toISOString(),
                        queryPrompt: queryPrompt,
                        matchScore: 0,
                        matchingSkills: [],
                        missingSkills: [],
                        candidateName: "Error Processing PDF",
                        candidateEmail: "Unknown",
                        candidatePhone: "Unknown",
                        yearsOfExperience: 0,
                        queryResponse: `There was an error parsing your PDF file: ${error.message || 'Unknown error'}. Please ensure it's a valid PDF that isn't password-protected.`,
                        insights: ["PDF parsing error. Try a different file format or check if the PDF is corrupted."]
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
