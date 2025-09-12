// Interactive Resume Editor
// This component provides a rich text editing experience for resumes

// Main Resume Editor object
const ResumeEditor = {
    // Current state
    editorInstance: null,
    currentResumeContent: "",
    suggestions: [],
    lastAnalysis: null,
    
    // Initialize the editor
    init: function(containerId, initialContent = "") {
        console.log('Resume Editor: Initializing editor');
        this.currentResumeContent = initialContent;
        
        // Create editor container
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Resume Editor: Container not found:', containerId);
            return;
        }
        
        // Create editor UI
        this.createEditorUI(container);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // If we have initial content, load it
        if (initialContent) {
            this.loadContent(initialContent);
        }
    },
    
    // Create the editor UI components
    createEditorUI: function(container) {
        container.innerHTML = `
            <div class="resume-editor-container">
                <div class="row">
                    <div class="col-lg-8">
                        <div class="card shadow mb-4">
                            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                                <h4 class="mb-0">Resume Editor</h4>
                                <div>
                                    <button id="analyzeResumeBtn" class="btn btn-light btn-sm">
                                        <i class="fas fa-search me-1"></i> Analyze
                                    </button>
                                    <button id="saveResumeBtn" class="btn btn-light btn-sm ms-2">
                                        <i class="fas fa-save me-1"></i> Save
                                    </button>
                                </div>
                            </div>
                            <div class="card-body">
                                <div id="resumeEditorToolbar">
                                    <div class="btn-group mb-2">
                                        <button type="button" class="btn btn-sm btn-outline-secondary format-btn" data-command="bold">
                                            <i class="fas fa-bold"></i>
                                        </button>
                                        <button type="button" class="btn btn-sm btn-outline-secondary format-btn" data-command="italic">
                                            <i class="fas fa-italic"></i>
                                        </button>
                                        <button type="button" class="btn btn-sm btn-outline-secondary format-btn" data-command="underline">
                                            <i class="fas fa-underline"></i>
                                        </button>
                                    </div>
                                    <div class="btn-group mb-2 ms-1">
                                        <button type="button" class="btn btn-sm btn-outline-secondary format-btn" data-command="insertUnorderedList">
                                            <i class="fas fa-list-ul"></i>
                                        </button>
                                        <button type="button" class="btn btn-sm btn-outline-secondary format-btn" data-command="insertOrderedList">
                                            <i class="fas fa-list-ol"></i>
                                        </button>
                                    </div>
                                    <div class="btn-group mb-2 ms-1">
                                        <button type="button" class="btn btn-sm btn-outline-secondary format-btn" data-command="formatBlock" data-value="h1">H1</button>
                                        <button type="button" class="btn btn-sm btn-outline-secondary format-btn" data-command="formatBlock" data-value="h2">H2</button>
                                        <button type="button" class="btn btn-sm btn-outline-secondary format-btn" data-command="formatBlock" data-value="h3">H3</button>
                                    </div>
                                    <div class="btn-group mb-2 ms-1">
                                        <button type="button" class="btn btn-sm btn-outline-secondary format-btn" data-command="insertSection" data-value="experience">
                                            + Experience
                                        </button>
                                        <button type="button" class="btn btn-sm btn-outline-secondary format-btn" data-command="insertSection" data-value="education">
                                            + Education
                                        </button>
                                        <button type="button" class="btn btn-sm btn-outline-secondary format-btn" data-command="insertSection" data-value="skills">
                                            + Skills
                                        </button>
                                    </div>
                                </div>
                                <div id="resumeEditorContent" class="form-control" contenteditable="true" style="min-height: 500px; border: 1px solid #ccc; padding: 10px; overflow-y: auto;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4">
                        <div class="card shadow mb-4">
                            <div class="card-header bg-primary text-white">
                                <h4 class="mb-0">Suggestions</h4>
                            </div>
                            <div class="card-body">
                                <div id="resumeSuggestions">
                                    <div class="alert alert-info">
                                        Start typing your resume or click "Analyze" to get suggestions for improvement.
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card shadow">
                            <div class="card-header bg-primary text-white">
                                <h4 class="mb-0">ATS Score</h4>
                            </div>
                            <div class="card-body">
                                <div id="resumeAtsScore">
                                    <div class="text-center">
                                        <div class="progress" style="height: 20px;">
                                            <div id="atsScoreProgress" class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
                                        </div>
                                        <p class="mt-3 mb-0">Enter job description to see ATS compatibility</p>
                                        <textarea id="jobDescriptionInput" class="form-control mt-2" rows="4" placeholder="Paste job description here..."></textarea>
                                        <button id="compareWithJobBtn" class="btn btn-primary btn-sm mt-2">Compare with Job</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Set up event listeners for editor controls
    setupEventListeners: function() {
        // Get the editor content element
        const editorContent = document.getElementById('resumeEditorContent');
        this.editorInstance = editorContent;
        
        // Add formatting button event listeners
        const formatButtons = document.querySelectorAll('.format-btn');
        formatButtons.forEach(button => {
            button.addEventListener('click', () => {
                const command = button.getAttribute('data-command');
                const value = button.getAttribute('data-value') || null;
                
                if (command === 'insertSection') {
                    this.insertSectionTemplate(value);
                } else {
                    document.execCommand(command, false, value);
                }
                
                editorContent.focus();
            });
        });
        
        // Add content change listener
        editorContent.addEventListener('input', () => {
            this.currentResumeContent = editorContent.innerHTML;
            this.debouncedAnalyzeContent();
        });
        
        // Add analyze button listener
        const analyzeButton = document.getElementById('analyzeResumeBtn');
        analyzeButton.addEventListener('click', () => {
            this.analyzeContent();
        });
        
        // Add save button listener
        const saveButton = document.getElementById('saveResumeBtn');
        saveButton.addEventListener('click', () => {
            this.saveResume();
        });
        
        // Add job comparison button listener
        const compareButton = document.getElementById('compareWithJobBtn');
        compareButton.addEventListener('click', () => {
            const jobDescription = document.getElementById('jobDescriptionInput').value;
            if (jobDescription) {
                this.compareWithJob(jobDescription);
            } else {
                alert('Please enter a job description first.');
            }
        });
    },
    
    // Debounced content analysis (to prevent too many calls while typing)
    debouncedAnalyzeContent: function() {
        if (this.analyzeTimeout) {
            clearTimeout(this.analyzeTimeout);
        }
        
        this.analyzeTimeout = setTimeout(() => {
            this.analyzeContent();
        }, 1500); // Wait 1.5 seconds after typing stops
    },
    
    // Analyze the current content and provide suggestions
    analyzeContent: async function() {
        console.log('Resume Editor: Analyzing content');
        
        // Get the plain text content
        const content = this.editorInstance.innerText || '';
        if (content.length < 50) {
            // Not enough content to analyze yet
            return;
        }
        
        try {
            // Use AIService to analyze content if available
            if (window.AIService) {
                // Analyze ATS compatibility
                const atsAnalysis = window.AIService.analyzeATSCompatibility(content);
                
                // Update UI with results
                this.updateSuggestionsUI(atsAnalysis);
                this.updateAtsScore(atsAnalysis.atsScore);
                
                // Store analysis results
                this.lastAnalysis = atsAnalysis;
            } else {
                console.error('Resume Editor: AIService not available');
            }
        } catch (error) {
            console.error('Resume Editor: Error analyzing content', error);
        }
    },
    
    // Update the suggestions UI based on analysis results
    updateSuggestionsUI: function(analysis) {
        const suggestionsContainer = document.getElementById('resumeSuggestions');
        if (!suggestionsContainer) return;
        
        // Clear previous suggestions
        suggestionsContainer.innerHTML = '';
        
        // Display formatting issues
        if (analysis.formattingIssues && analysis.formattingIssues.length > 0) {
            const formattingIssuesHtml = `
                <div class="suggestion-card">
                    <h5 class="suggestion-title">Formatting Issues</h5>
                    <ul class="list-group list-group-flush">
                        ${analysis.formattingIssues.map(issue => `
                            <li class="list-group-item">
                                <span class="badge bg-${issue.impact === 'high' ? 'danger' : (issue.impact === 'medium' ? 'warning' : 'info')} me-2">${issue.impact}</span>
                                ${issue.name}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
            suggestionsContainer.innerHTML += formattingIssuesHtml;
        }
        
        // Display improvement tips
        if (analysis.improvementTips && analysis.improvementTips.length > 0) {
            const tipsHtml = `
                <div class="suggestion-card mt-3">
                    <h5 class="suggestion-title">Improvement Tips</h5>
                    <ul class="list-group list-group-flush">
                        ${analysis.improvementTips.map(tip => `
                            <li class="list-group-item">
                                <i class="fas fa-check-circle text-success me-2"></i>
                                ${tip}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
            suggestionsContainer.innerHTML += tipsHtml;
        }
        
        // If we have no issues and no tips, show success message
        if ((!analysis.formattingIssues || analysis.formattingIssues.length === 0) && 
            (!analysis.improvementTips || analysis.improvementTips.length === 0)) {
            suggestionsContainer.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle me-2"></i> Your resume looks good! No major issues detected.
                </div>
            `;
        }
    },
    
    // Update the ATS score display
    updateAtsScore: function(score) {
        const scoreProgress = document.getElementById('atsScoreProgress');
        if (!scoreProgress) return;
        
        scoreProgress.style.width = `${score}%`;
        scoreProgress.innerText = `${score}%`;
        scoreProgress.setAttribute('aria-valuenow', score);
        
        // Set color based on score
        if (score >= 80) {
            scoreProgress.classList.remove('bg-warning', 'bg-danger');
            scoreProgress.classList.add('bg-success');
        } else if (score >= 60) {
            scoreProgress.classList.remove('bg-success', 'bg-danger');
            scoreProgress.classList.add('bg-warning');
        } else {
            scoreProgress.classList.remove('bg-success', 'bg-warning');
            scoreProgress.classList.add('bg-danger');
        }
    },
    
    // Compare resume with job description
    compareWithJob: async function(jobDescription) {
        console.log('Resume Editor: Comparing with job description');
        
        try {
            // Get the current content
            const content = this.editorInstance.innerText || '';
            
            // Use AIService to analyze
            if (window.AIService) {
                // First analyze the job description
                const jobAnalysis = await window.AIService.analyzeJobDescription(jobDescription);
                
                // Then analyze the resume and compare
                const resumeAnalysis = window.AIService.processAIResponse(content, "Extract key information", content);
                
                // Calculate match score based on matching keywords
                const matchingKeywords = jobAnalysis.topKeywords.filter(keyword => 
                    resumeAnalysis.matchingSkills.some(skill => 
                        skill.toLowerCase().includes(keyword.toLowerCase())
                    )
                );
                
                const matchScore = Math.round((matchingKeywords.length / jobAnalysis.topKeywords.length) * 100);
                
                // Update UI with results
                this.updateComparisonResults(jobAnalysis, resumeAnalysis, matchScore, matchingKeywords);
                this.updateAtsScore(matchScore);
            } else {
                console.error('Resume Editor: AIService not available');
            }
        } catch (error) {
            console.error('Resume Editor: Error comparing with job', error);
        }
    },
    
    // Update UI with job comparison results
    updateComparisonResults: function(jobAnalysis, resumeAnalysis, matchScore, matchingKeywords) {
        const suggestionsContainer = document.getElementById('resumeSuggestions');
        if (!suggestionsContainer) return;
        
        // Clear previous suggestions
        suggestionsContainer.innerHTML = '';
        
        // Display match score
        suggestionsContainer.innerHTML += `
            <div class="alert ${matchScore >= 70 ? 'alert-success' : (matchScore >= 50 ? 'alert-warning' : 'alert-danger')}">
                <h5><i class="fas ${matchScore >= 70 ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2"></i> Job Match: ${matchScore}%</h5>
                <p class="mb-0">Your resume matches ${matchScore}% of the key requirements in this job description.</p>
            </div>
        `;
        
        // Display matching keywords
        if (matchingKeywords.length > 0) {
            suggestionsContainer.innerHTML += `
                <div class="suggestion-card mt-3">
                    <h5 class="suggestion-title">Matching Keywords</h5>
                    <div class="d-flex flex-wrap gap-1 mt-2">
                        ${matchingKeywords.map(keyword => `
                            <span class="badge bg-success">${keyword}</span>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Display missing keywords
        const missingKeywords = jobAnalysis.topKeywords.filter(keyword => 
            !matchingKeywords.includes(keyword)
        );
        
        if (missingKeywords.length > 0) {
            suggestionsContainer.innerHTML += `
                <div class="suggestion-card mt-3">
                    <h5 class="suggestion-title">Missing Keywords</h5>
                    <p>Consider adding these keywords to your resume:</p>
                    <div class="d-flex flex-wrap gap-1 mt-2">
                        ${missingKeywords.map(keyword => `
                            <span class="badge bg-secondary">${keyword}</span>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Display improvement suggestions
        suggestionsContainer.innerHTML += `
            <div class="suggestion-card mt-3">
                <h5 class="suggestion-title">Tailoring Suggestions</h5>
                <ul class="list-group list-group-flush">
                    ${jobAnalysis.improvementSuggestions.map(suggestion => `
                        <li class="list-group-item">
                            <i class="fas fa-lightbulb text-warning me-2"></i>
                            ${suggestion}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    },
    
    // Insert a section template
    insertSectionTemplate: function(sectionType) {
        if (!this.editorInstance) return;
        
        let template = '';
        
        switch(sectionType) {
            case 'experience':
                template = `
                    <h2>Experience</h2>
                    <div class="resume-item">
                        <h3>Job Title</h3>
                        <h4>Company Name</h4>
                        <p class="resume-date">Month Year - Present</p>
                        <ul>
                            <li>Key achievement or responsibility</li>
                            <li>Key achievement or responsibility</li>
                            <li>Key achievement or responsibility</li>
                        </ul>
                    </div>
                `;
                break;
                
            case 'education':
                template = `
                    <h2>Education</h2>
                    <div class="resume-item">
                        <h3>Degree Name</h3>
                        <h4>University Name</h4>
                        <p class="resume-date">Year - Year</p>
                        <p>GPA: X.XX / 4.00</p>
                        <p>Relevant coursework: Course 1, Course 2, Course 3</p>
                    </div>
                `;
                break;
                
            case 'skills':
                template = `
                    <h2>Skills</h2>
                    <div class="resume-item">
                        <p><strong>Technical:</strong> Skill 1, Skill 2, Skill 3, Skill 4</p>
                        <p><strong>Software:</strong> Software 1, Software 2, Software 3</p>
                        <p><strong>Languages:</strong> Language 1, Language 2</p>
                    </div>
                `;
                break;
                
            default:
                template = '<h2>New Section</h2><p>Section content goes here.</p>';
        }
        
        // Insert at cursor position or at end if no selection
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const node = document.createElement('div');
            node.innerHTML = template;
            range.insertNode(node);
        } else {
            this.editorInstance.innerHTML += template;
        }
        
        // Update content
        this.currentResumeContent = this.editorInstance.innerHTML;
    },
    
    // Load content into the editor
    loadContent: function(content) {
        if (!this.editorInstance) return;
        
        this.editorInstance.innerHTML = content;
        this.currentResumeContent = content;
        
        // Analyze after loading
        this.analyzeContent();
    },
    
    // Save the current resume
    saveResume: function() {
        const content = this.currentResumeContent;
        
        // Create a resume object
        const resume = {
            content: content,
            plainText: this.editorInstance.innerText,
            lastModified: new Date().toISOString(),
            atsScore: this.lastAnalysis ? this.lastAnalysis.atsScore : 0
        };
        
        // Dispatch a custom event for the app to handle saving
        const saveEvent = new CustomEvent('resumeSave', {
            detail: {
                resume: resume
            }
        });
        
        document.dispatchEvent(saveEvent);
        
        alert('Resume saved successfully!');
    }
};

// Export the module
window.ResumeEditor = ResumeEditor;
