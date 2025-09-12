// Multi Resume Scanner Module
// Handles scanning and correlation of multiple resume files

const MultiScan = {
    // Properties
    files: [],
    results: null,
    isAnalyzing: false,
    
    // Initialize the module
    init: function() {
        console.log('MultiScan: Initializing');
        this.setupEventListeners();
    },
    
    // Set up event listeners for file selection and scanning
    setupEventListeners: function() {
        const filesInput = document.getElementById('resumeFiles');
        if (filesInput) {
            filesInput.addEventListener('change', () => this.handleFileSelection(filesInput.files));
        }
        
        const scanForm = document.getElementById('scanForm');
        if (scanForm) {
            scanForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.startScan();
            });
        }
    },
    
    // Handle file selection
    handleFileSelection: function(fileList) {
        if (!fileList || fileList.length === 0) {
            this.files = [];
            this.updateFilesList();
            return;
        }
        
        // Convert FileList to array
        this.files = Array.from(fileList);
        console.log('MultiScan: Selected files:', this.files.length);
        
        // Update the UI
        this.updateFilesList();
    },
    
    // Update the files list in the UI
    updateFilesList: function() {
        const filesList = document.getElementById('filesList');
        const filesCount = document.getElementById('filesCount');
        
        if (!filesList) return;
        
        // Update count
        if (filesCount) {
            filesCount.textContent = this.files.length;
        }
        
        // Update list
        if (this.files.length === 0) {
            filesList.innerHTML = '<div class="list-group-item text-muted">No files selected</div>';
            return;
        }
        
        filesList.innerHTML = '';
        this.files.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'list-group-item d-flex justify-content-between align-items-center';
            
            const fileIcon = this.getFileIcon(file.type);
            const fileSize = this.formatFileSize(file.size);
            
            item.innerHTML = `
                <span>
                    <i class="${fileIcon} me-2"></i>
                    ${file.name}
                </span>
                <span class="badge bg-secondary">${fileSize}</span>
            `;
            
            filesList.appendChild(item);
        });
    },
    
    // Get appropriate icon for file type
    getFileIcon: function(fileType) {
        if (fileType === 'application/pdf') {
            return 'fas fa-file-pdf text-danger';
        } else if (fileType.includes('word') || fileType.includes('document')) {
            return 'fas fa-file-word text-primary';
        } else if (fileType === 'text/plain') {
            return 'fas fa-file-alt text-secondary';
        } else {
            return 'fas fa-file text-secondary';
        }
    },
    
    // Format file size for display
    formatFileSize: function(bytes) {
        if (bytes < 1024) {
            return bytes + ' B';
        } else if (bytes < 1024 * 1024) {
            return (bytes / 1024).toFixed(1) + ' KB';
        } else {
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        }
    },
    
    // Start scanning process
    startScan: async function() {
        if (this.isAnalyzing) {
            alert('Analysis is already in progress. Please wait.');
            return;
        }
        
        if (this.files.length === 0) {
            alert('Please select at least one file to scan.');
            return;
        }
        
        const queryPrompt = document.getElementById('queryPrompt').value.trim();
        if (!queryPrompt) {
            alert('Please enter an analysis prompt.');
            return;
        }
        
        // Get correlation setting
        const enableCorrelation = document.getElementById('enableCorrelationAnalysis')?.checked ?? true;
        
        // Update UI to show analysis in progress
        this.isAnalyzing = true;
        this.updateScanButton(true);
        this.showResults(true);
        this.updateResultsContent('<div class="text-center p-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-3">Analyzing resumes, please wait...</p></div>');
        
        try {
            // Use AIService to analyze the resumes
            if (window.AIService) {
                if (this.files.length === 1) {
                    // Single file scan
                    await this.performSingleFileScan(this.files[0], queryPrompt);
                } else {
                    // Multi-file scan
                    await this.performMultiFileScan(this.files, queryPrompt, enableCorrelation);
                }
            } else {
                throw new Error('AI Service not available');
            }
        } catch (error) {
            console.error('Scan error:', error);
            this.updateResultsContent(`
                <div class="alert alert-danger">
                    <h4 class="alert-heading">Error</h4>
                    <p>There was an error analyzing the resumes: ${error.message}</p>
                </div>
            `);
        } finally {
            this.isAnalyzing = false;
            this.updateScanButton(false);
        }
    },
    
    // Update the scan button state
    updateScanButton: function(isScanning) {
        const scanButton = document.getElementById('scanButton');
        if (!scanButton) return;
        
        if (isScanning) {
            scanButton.disabled = true;
            scanButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Analyzing...';
        } else {
            scanButton.disabled = false;
            scanButton.innerHTML = '<i class="fas fa-search me-1"></i> Scan Resumes';
        }
    },
    
    // Show/hide the results section
    showResults: function(show) {
        const resultsSection = document.getElementById('results');
        if (!resultsSection) return;
        
        if (show) {
            resultsSection.style.display = 'block';
            // Scroll to results
            setTimeout(() => {
                resultsSection.scrollIntoView({ behavior: 'smooth' });
            }, 300);
        } else {
            resultsSection.style.display = 'none';
        }
    },
    
    // Update the query result container
    updateResultsContent: function(content) {
        const queryResult = document.getElementById('queryResult');
        if (queryResult) {
            queryResult.innerHTML = content;
        }
    },
    
    // Perform scan on a single file
    performSingleFileScan: async function(file, queryPrompt) {
        // Read file text
        let resumeText = '';
        
        if (window.PdfHandler && file.type === 'application/pdf') {
            resumeText = await window.PdfHandler.extractTextFromPdf(file);
        } else {
            // For non-PDF files, use a text reader or appropriate method
            const reader = new FileReader();
            resumeText = await new Promise((resolve) => {
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsText(file);
            });
        }
        
        // Analyze with AIService
        const result = await window.AIService.analyzeResume(resumeText, queryPrompt);
        this.results = { individualResults: [result], queryPrompt, fileName: file.name };
        
        // Display results
        this.displaySingleFileResults(result);
    },
    
    // Perform scan on multiple files
    performMultiFileScan: async function(files, queryPrompt, enableCorrelation) {
        // Use the new multi-resume analysis method
        const results = await window.AIService.analyzeMultipleResumes(files, queryPrompt, enableCorrelation);
        this.results = results;
        
        // Display results
        this.displayMultiFileResults(results);
    },
    
    // Display results for a single file
    displaySingleFileResults: function(result) {
        // Hide the correlation section
        document.getElementById('summary-tab')?.parentElement?.classList.add('d-none');
        
        // Update query result
        const queryResult = document.getElementById('queryResult');
        if (queryResult) {
            queryResult.innerHTML = `
                <div class="mb-3">
                    <strong>File:</strong> ${this.results.fileName}
                </div>
                <div class="mb-3">
                    <strong>Query:</strong> ${this.results.queryPrompt}
                </div>
                <div class="alert alert-light border">
                    ${result.queryResponse}
                </div>
            `;
        }
        
        // Update ATS score
        this.updateATSScore(result.atsScore || 0);
        
        // Update skills section
        const matchDetails = document.getElementById('matchDetails');
        if (matchDetails && result.matchingSkills) {
            let skillsHtml = '';
            
            if (result.matchingSkills.length > 0) {
                skillsHtml = `
                    <div class="mb-3">
                        <h5>Skills Detected</h5>
                        <div class="d-flex flex-wrap gap-2 mt-3">
                            ${result.matchingSkills.map(skill => `
                                <span class="badge bg-success">${skill}</span>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else {
                skillsHtml = `<div class="alert alert-warning">No skills detected</div>`;
            }
            
            matchDetails.innerHTML = skillsHtml;
        }
        
        // Update insights section
        const aiInsights = document.getElementById('aiInsights');
        if (aiInsights && result.insights) {
            aiInsights.innerHTML = `
                <ul class="list-group">
                    ${result.insights.map(insight => `
                        <li class="list-group-item">
                            <i class="fas fa-lightbulb text-warning me-2"></i>
                            ${insight}
                        </li>
                    `).join('')}
                </ul>
            `;
        }
    },
    
    // Display results for multiple files
    displayMultiFileResults: function(results) {
        // Show the correlation section
        document.getElementById('summary-tab')?.parentElement?.classList.remove('d-none');
        
        // Create tabs for each file
        this.createResultTabs(results);
        
        // Update correlation results
        const correlationResult = document.getElementById('correlationResult');
        if (correlationResult && results.correlationAnalysis) {
            const correlation = results.correlationAnalysis;
            
            let bestMatchesHtml = '';
            if (correlation.bestMatches && correlation.bestMatches.length > 0) {
                bestMatchesHtml = `
                    <div class="card mb-4">
                        <div class="card-header bg-light">Best Matches for Query: "${results.queryPrompt}"</div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Candidate</th>
                                            <th>File</th>
                                            <th>Score</th>
                                            <th>Relevance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${correlation.bestMatches.map((match, index) => `
                                            <tr>
                                                <td>${index + 1}</td>
                                                <td>${match.name}</td>
                                                <td>${match.fileName}</td>
                                                <td>${match.score}</td>
                                                <td>
                                                    <span class="badge ${this.getRelevanceBadgeClass(match.relevance)}">${match.relevance}</span>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            // Common skills section
            let commonSkillsHtml = '';
            if (correlation.commonSkills && correlation.commonSkills.length > 0) {
                commonSkillsHtml = `
                    <div class="col-md-6">
                        <div class="card h-100">
                            <div class="card-header bg-light">Common Skills Across All Resumes</div>
                            <div class="card-body">
                                <div class="d-flex flex-wrap gap-2">
                                    ${correlation.commonSkills.map(skill => `
                                        <span class="badge bg-primary">${skill}</span>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            // Experience distribution
            let experienceHtml = '';
            if (correlation.experienceDistribution) {
                const distribution = correlation.experienceDistribution;
                experienceHtml = `
                    <div class="col-md-6">
                        <div class="card h-100">
                            <div class="card-header bg-light">Experience Distribution</div>
                            <div class="card-body">
                                <div class="d-flex flex-column gap-2">
                                    <div>
                                        <label>Junior (0-2 years)</label>
                                        <div class="progress" style="height: 20px;">
                                            <div class="progress-bar bg-info" role="progressbar" style="width: ${Math.round(distribution['Junior (0-2 years)'] / correlation.candidateCount * 100)}%;" 
                                                aria-valuenow="${distribution['Junior (0-2 years)']}" aria-valuemin="0" 
                                                aria-valuemax="${correlation.candidateCount}">
                                                ${distribution['Junior (0-2 years)']}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label>Mid-level (3-5 years)</label>
                                        <div class="progress" style="height: 20px;">
                                            <div class="progress-bar bg-primary" role="progressbar" style="width: ${Math.round(distribution['Mid-level (3-5 years)'] / correlation.candidateCount * 100)}%;" 
                                                aria-valuenow="${distribution['Mid-level (3-5 years)']}" aria-valuemin="0" 
                                                aria-valuemax="${correlation.candidateCount}">
                                                ${distribution['Mid-level (3-5 years)']}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label>Senior (6+ years)</label>
                                        <div class="progress" style="height: 20px;">
                                            <div class="progress-bar bg-success" role="progressbar" style="width: ${Math.round(distribution['Senior (6+ years)'] / correlation.candidateCount * 100)}%;" 
                                                aria-valuenow="${distribution['Senior (6+ years)']}" aria-valuemin="0" 
                                                aria-valuemax="${correlation.candidateCount}">
                                                ${distribution['Senior (6+ years)']}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            // Insights
            let insightsHtml = '';
            if (correlation.insights && correlation.insights.length > 0) {
                insightsHtml = `
                    <div class="card mt-4">
                        <div class="card-header bg-light">Key Insights</div>
                        <div class="card-body">
                            <ul class="list-group list-group-flush">
                                ${correlation.insights.map(insight => `
                                    <li class="list-group-item">
                                        <i class="fas fa-lightbulb text-warning me-2"></i>
                                        ${insight}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                `;
            }
            
            correlationResult.innerHTML = `
                ${bestMatchesHtml}
                <div class="row g-4 mb-4">
                    ${commonSkillsHtml}
                    ${experienceHtml}
                </div>
                ${insightsHtml}
            `;
        } else if (correlationResult) {
            correlationResult.innerHTML = `
                <div class="alert alert-info">
                    <h5><i class="fas fa-info-circle me-2"></i> Single Resume Analysis</h5>
                    <p>Correlation analysis is only available when scanning multiple resumes. Please select more than one file to enable this feature.</p>
                </div>
            `;
        }
        
        // Update query result
        const queryResult = document.getElementById('queryResult');
        if (queryResult) {
            queryResult.innerHTML = `
                <div class="mb-3">
                    <strong>Query:</strong> ${results.queryPrompt}
                </div>
                <div class="alert alert-light border">
                    ${results.individualResults.length} resumes analyzed. Click on the tabs above to view individual results or see the Summary tab for correlation analysis.
                </div>
            `;
        }
    },
    
    // Create tabs for each file result
    createResultTabs: function(results) {
        const tabsList = document.getElementById('resultsFileTabs');
        const tabsContent = document.getElementById('resultsFileContent');
        
        if (!tabsList || !tabsContent || !results.individualResults) return;
        
        // Clear existing file tabs (keep only summary tab)
        const existingFileTabs = tabsList.querySelectorAll('li:not(:first-child)');
        existingFileTabs.forEach(tab => tab.remove());
        
        // Clear existing file content tabs (keep only summary tab)
        const existingFileContents = tabsContent.querySelectorAll('.tab-pane:not(#summary-content)');
        existingFileContents.forEach(content => content.remove());
        
        // Create new tabs for each file
        results.individualResults.forEach((result, index) => {
            const fileName = result.fileName || `File ${index + 1}`;
            const tabId = `file-${index}-tab`;
            const contentId = `file-${index}-content`;
            
            // Create tab
            const tabItem = document.createElement('li');
            tabItem.className = 'nav-item';
            tabItem.setAttribute('role', 'presentation');
            tabItem.innerHTML = `
                <button class="nav-link" id="${tabId}" data-bs-toggle="pill" data-bs-target="#${contentId}" 
                    type="button" role="tab" aria-selected="false">
                    <i class="fas fa-file me-1"></i> ${fileName.length > 15 ? fileName.substring(0, 12) + '...' : fileName}
                </button>
            `;
            tabsList.appendChild(tabItem);
            
            // Create content
            const content = document.createElement('div');
            content.className = 'tab-pane fade';
            content.id = contentId;
            content.setAttribute('role', 'tabpanel');
            content.setAttribute('aria-labelledby', tabId);
            
            content.innerHTML = this.createFileResultHTML(result);
            tabsContent.appendChild(content);
        });
    },
    
    // Create HTML for individual file results
    createFileResultHTML: function(result) {
        // Candidate info section
        const candidateInfoHtml = `
            <div class="card mb-4">
                <div class="card-header bg-light">
                    <h5 class="mb-0">Candidate Information</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Name:</strong> ${result.candidateName || 'Not detected'}</p>
                            <p><strong>Email:</strong> ${result.candidateEmail || 'Not detected'}</p>
                            <p><strong>Phone:</strong> ${result.candidatePhone || 'Not detected'}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Years of Experience:</strong> ${result.yearsOfExperience || 'Not detected'}</p>
                            <p><strong>ATS Score:</strong> ${result.atsScore ? result.atsScore + '%' : 'Not calculated'}</p>
                            <p><strong>File:</strong> ${result.fileName || 'Unknown'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Skills section
        let skillsHtml = '';
        if (result.matchingSkills && result.matchingSkills.length > 0) {
            skillsHtml = `
                <div class="card mb-4">
                    <div class="card-header bg-light">
                        <h5 class="mb-0">Skills</h5>
                    </div>
                    <div class="card-body">
                        <div class="d-flex flex-wrap gap-2">
                            ${result.matchingSkills.map(skill => `
                                <span class="badge bg-success">${skill}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Insights section
        let insightsHtml = '';
        if (result.insights && result.insights.length > 0) {
            insightsHtml = `
                <div class="card mb-4">
                    <div class="card-header bg-light">
                        <h5 class="mb-0">Insights</h5>
                    </div>
                    <div class="card-body">
                        <ul class="list-group list-group-flush">
                            ${result.insights.map(insight => `
                                <li class="list-group-item">
                                    <i class="fas fa-lightbulb text-warning me-2"></i>
                                    ${insight}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            `;
        }
        
        return candidateInfoHtml + skillsHtml + insightsHtml;
    },
    
    // Get badge class based on relevance
    getRelevanceBadgeClass: function(relevance) {
        switch (relevance) {
            case 'Excellent match': return 'bg-success';
            case 'Good match': return 'bg-primary';
            case 'Moderate match': return 'bg-info';
            case 'Low match': return 'bg-warning';
            default: return 'bg-secondary';
        }
    },
    
    // Update ATS score UI
    updateATSScore: function(score) {
        const atsScoreBar = document.getElementById('atsScoreBar');
        const atsScoreBadge = document.getElementById('atsScoreBadge');
        
        if (atsScoreBar) {
            atsScoreBar.style.width = score + '%';
            atsScoreBar.textContent = score + '%';
            atsScoreBar.setAttribute('aria-valuenow', score);
            
            // Update color based on score
            atsScoreBar.className = 'progress-bar';
            if (score >= 80) {
                atsScoreBar.classList.add('bg-success');
            } else if (score >= 60) {
                atsScoreBar.classList.add('bg-warning');
            } else {
                atsScoreBar.classList.add('bg-danger');
            }
        }
        
        if (atsScoreBadge) {
            atsScoreBadge.textContent = score + '%';
        }
        
        // Update component scores if they exist
        const keywordScore = document.getElementById('keywordScore');
        const formattingScore = document.getElementById('formattingScore');
        const contactScore = document.getElementById('contactScore');
        
        // For demo purposes, we'll just use the same score for all components
        // In a real implementation, you would use the actual component scores
        if (keywordScore) keywordScore.textContent = score + '%';
        if (formattingScore) formattingScore.textContent = score + '%';
        if (contactScore) contactScore.textContent = score + '%';
    }
};

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    MultiScan.init();
});

// Export the module
window.MultiScan = MultiScan;
