// AI Service for ResumeAI Scanner
// This file integrates with an AI API for resume analysis

// Main AI Service object
const AIService = {
    // API configuration
    apiKey: '', // You'll need to add your API key
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    
    // Analyze a resume with a query
    analyzeResume: async function(resumeText, queryPrompt) {
        try {
            // Prepare the prompt for the AI
            const prompt = this.preparePrompt(resumeText, queryPrompt);
            
            // Make API request to OpenAI
            const response = await this.makeAPIRequest(prompt, resumeText);
            
            // Process the AI response
            return this.processAIResponse(response, queryPrompt, resumeText);
        } catch (error) {
            console.error('AI Analysis Error:', error);
            return this.getFallbackResponse(resumeText);
        }
    },
    
    // Prepare the prompt for AI
    preparePrompt: function(resumeText, queryPrompt) {
        let prompt = `
            You are an AI resume analyzer. I've provided a resume below.
            Your task is to answer the following query about the resume: "${queryPrompt}"
            
            Provide a detailed, accurate response based solely on the content of the resume.
            
            RESUME:
            ${resumeText}
            
            QUERY: ${queryPrompt}
        `;
        
        return prompt;
    },
    
    // Make the API request to OpenAI
    makeAPIRequest: async function(prompt, resumeText) {
        // In a production environment, you would make a real API call
        // For this demo, we'll extract information directly from the resume text
        
        console.log('AI Service: Analyzing resume content with length:', resumeText.length);
        
        // Check if we received a very short or empty text (indicates possible PDF parsing issues)
        if (!resumeText || resumeText.trim().length < 50) {
            console.warn('AI Service: Resume text is too short or empty:', resumeText);
            return "Error extracting text from PDF. This may be due to the PDF structure or security settings.";
        }
        
        // This is where you would typically have code like:
        /*
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a resume analysis assistant.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });
        
        const data = await response.json();
        return data.choices[0].message.content;
        */
        
        // For the demo, we'll extract information directly
        return resumeText;
    },
    
    // Process the resume text to extract information
    processAIResponse: function(resumeText, queryPrompt, originalText) {
        // Add debugging logs
        console.log('AI Service: Processing resume text, length:', resumeText.length);
        
        // Check if the resume text contains error indicators
        if (resumeText.includes("image-based or using non-standard fonts") || 
            resumeText.includes("Error extracting text from PDF")) {
            console.log('AI Service: Detected PDF extraction error message');
            return {
                matchScore: 0,
                matchingSkills: [],
                missingSkills: [],
                candidateName: "PDF Processing Issue",
                candidateEmail: "Unknown",
                candidatePhone: "Unknown",
                yearsOfExperience: 0,
                queryResponse: `We're having trouble extracting text from this PDF file. It may be an image-based PDF or use custom fonts. Try uploading a text-based PDF or a DOC/DOCX file.`,
                insights: [
                    "PDF parsing issue detected.", 
                    "This PDF may contain scanned images instead of text.",
                    "Try using a different file format or a PDF with selectable text."
                ]
            };
        }
        
        // Extract basic information from resume
        const lines = resumeText.split('\n');
        
        // Extract candidate name (typically at the top of the resume)
        let candidateName = "Unknown";
        
        // First try to find lines that contain only a name (typically at the very top of resume)
        for (let i = 0; i < Math.min(15, lines.length); i++) {
            const line = lines[i].trim();
            
            // Skip empty lines and very short lines
            if (line.length < 3) continue;
            
            // Look for name patterns - more flexible to catch more name formats
            
            // Pattern 1: Standard 2-3 word name (First Middle? Last)
            if (/^[A-Z][a-zA-Z\.]+([ \-][A-Z][a-zA-Z\.]+){1,2}$/.test(line) && line.length < 40 && !line.includes('@')) {
                candidateName = line;
                break;
            }
            
            // Pattern 2: Name followed by credentials (John Smith, MBA)
            const credentialsPattern = /^([A-Z][a-zA-Z\.]+([ \-][A-Z][a-zA-Z\.]+){1,2}),.*$/;
            const credentialsMatch = line.match(credentialsPattern);
            if (credentialsMatch && credentialsMatch[1] && credentialsMatch[1].length < 40) {
                candidateName = credentialsMatch[1];
                break;
            }
            
            // Pattern 3: ALL CAPS name
            if (/^[A-Z]+(?:[ \-][A-Z]+){1,3}$/.test(line) && line.length < 40) {
                candidateName = line.split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ');
                break;
            }
        }
        
        // If no name found in isolated lines, try looking in blocks of text
        if (candidateName === "Unknown") {
            const resumeText = lines.join(' ');
            const namePatterns = [
                /(?:^|[^a-zA-Z])(?:name is|I am|I'm) ([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+){1,2})(?:[^a-zA-Z]|$)/,
                /^([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+){1,2})(?:\s*[\|\-•]|$)/
            ];
            
            for (const pattern of namePatterns) {
                const match = resumeText.match(pattern);
                if (match && match[1] && match[1].length < 40) {
                    candidateName = match[1];
                    break;
                }
            }
        }
        
        // Extract email (look for email pattern)
        let candidateEmail = "Unknown";
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
        const emailMatches = resumeText.match(emailRegex);
        if (emailMatches) {
            // Use the first email found
            candidateEmail = emailMatches[0];
            
            // Log all found emails for debugging
            console.log('Found emails:', emailMatches);
        }
        
        // Extract phone number - support multiple formats
        let candidatePhone = "Unknown";
        const phoneRegexes = [
            // Standard US format with various separators
            /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/,
            // Format with country code
            /\+\d{1,2}[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/,
            // Simple 10-digit number
            /\b\d{10}\b/
        ];
        
        for (const regex of phoneRegexes) {
            const phoneMatch = resumeText.match(regex);
            if (phoneMatch) {
                candidatePhone = phoneMatch[0];
                
                // Format phone number for readability if it's a simple 10 digits
                if (/^\d{10}$/.test(candidatePhone)) {
                    candidatePhone = candidatePhone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                }
                
                break;
            }
        }
        
        // Log raw text for debugging purposes
        console.log('Resume text sample (first 200 chars):', resumeText.substring(0, 200));
        
        // Extract skills
        const commonSkills = [
            'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Swift', 'HTML', 
            'CSS', 'SQL', 'React', 'Angular', 'Vue', 'Node.js', 'Django', 'Flask', 
            'Spring Boot', 'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 
            'Git', 'REST API', 'GraphQL', 'TypeScript', 'MongoDB', 'MySQL', 'PostgreSQL',
            'Communication', 'Leadership', 'Project Management', 'Agile', 'Scrum', 
            'Microsoft Office', 'Excel', 'Word', 'PowerPoint', 'Data Analysis',
            'Machine Learning', 'AI', 'Deep Learning', 'NLP', 'Computer Vision'
        ];
        
        const matchingSkills = [];
        commonSkills.forEach(skill => {
            // Look for the skill in the resume (case insensitive)
            const regex = new RegExp('\\b' + skill + '\\b', 'i');
            if (regex.test(resumeText)) {
                matchingSkills.push(skill);
            }
        });
        
        // Estimate years of experience based on work history
        let yearsOfExperience = 0;
        const yearRangeRegex = /(20[0-2][0-9])[\s\-–—]+(?:present|current|now|20[0-2][0-9])/gi;
        const yearMatches = resumeText.match(yearRangeRegex);
        
        if (yearMatches) {
            yearMatches.forEach(match => {
                const startYear = parseInt(match.match(/\d{4}/)[0]);
                const endYearMatch = match.match(/(present|current|now|20[0-2][0-9])/i);
                
                let endYear;
                if (endYearMatch[0].match(/present|current|now/i)) {
                    endYear = new Date().getFullYear();
                } else {
                    endYear = parseInt(endYearMatch[0]);
                }
                
                if (endYear >= startYear) {
                    yearsOfExperience += endYear - startYear;
                }
            });
        }
        
        // Generate query response
        let queryResponse = '';
        const queryLower = queryPrompt.toLowerCase();
        
        if (queryLower.includes('name')) {
            if (candidateName !== "Unknown") {
                queryResponse = `The candidate's name is <span class="query-highlight">${candidateName}</span>.`;
            } else {
                queryResponse = `I couldn't find a name in this resume. The document may be formatted unusually or the name might not be clearly identified.`;
            }
        } else if (queryLower.includes('email')) {
            if (candidateEmail !== "Unknown") {
                queryResponse = `The candidate's email is <span class="query-highlight">${candidateEmail}</span>.`;
            } else {
                queryResponse = `I couldn't find an email address in this resume. Please check if the resume includes contact information.`;
            }
        } else if (queryLower.includes('phone') || queryLower.includes('number') || queryLower.includes('contact')) {
            if (candidatePhone !== "Unknown") {
                queryResponse = `The candidate's phone number is <span class="query-highlight">${candidatePhone}</span>.`;
            } else {
                queryResponse = `I couldn't find a phone number in this resume. Please check if the resume includes contact information.`;
            }
        } else if (queryLower.includes('experience')) {
            if (yearsOfExperience > 0) {
                queryResponse = `The candidate has approximately <span class="query-highlight">${yearsOfExperience} years</span> of professional experience.`;
            } else {
                queryResponse = `I couldn't accurately determine the years of experience from this resume. The work history might not include clear date ranges.`;
            }
        } else if (queryLower.includes('skill')) {
            if (matchingSkills.length > 0) {
                queryResponse = `The candidate's key skills include <span class="query-highlight">${matchingSkills.slice(0, 7).join(', ')}</span>.`;
            } else {
                queryResponse = `I couldn't identify specific skills in this resume. Try uploading a resume that lists skills more explicitly.`;
            }
        } else {
            // For other queries, provide a helpful response
            if (candidateName !== "Unknown") {
                queryResponse = `Based on the resume, your query about "${queryPrompt}" might be related to ${candidateName}'s background, but I don't have enough information to provide a specific answer. Try asking about their name, email, phone, experience, or skills.`;
            } else {
                queryResponse = `I couldn't extract enough information from this resume to answer your specific query. For best results, try asking simple questions like "What's their name?", "What's their email?", or "What skills do they have?".`;
            }
        }
        
        // Generate insights
        const insights = [
            `This resume appears to belong to ${candidateName}.`,
            `Contact information: ${candidateEmail} | ${candidatePhone}`,
            `The candidate has approximately ${yearsOfExperience} years of professional experience.`,
            `Key skills identified: ${matchingSkills.slice(0, 5).join(', ')}.`
        ];
        
        // Return analyzed data
        return {
            matchScore: 100, // Not using match score anymore
            matchingSkills: matchingSkills,
            missingSkills: [],
            candidateName: candidateName,
            candidateEmail: candidateEmail,
            candidatePhone: candidatePhone,
            yearsOfExperience: yearsOfExperience,
            queryResponse: queryResponse,
            insights: insights
        };
    },
    
    // Fallback response in case of errors
    getFallbackResponse: function(resumeText) {
        // Try to extract at least some basic information even in case of error
        let candidateName = "Unknown";
        let candidateEmail = "unknown@example.com";
        let candidatePhone = "Unknown";
        
        try {
            // Try to extract email
            const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
            const emailMatch = resumeText.match(emailRegex);
            if (emailMatch) {
                candidateEmail = emailMatch[0];
            }
            
            // Try to extract phone
            const phoneRegex = /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
            const phoneMatch = resumeText.match(phoneRegex);
            if (phoneMatch) {
                candidatePhone = phoneMatch[0];
            }
        } catch (e) {
            console.error("Error in fallback response:", e);
        }
        
        return {
            matchScore: 0,
            matchingSkills: ['Communication', 'Problem Solving', 'Teamwork'],
            missingSkills: [],
            candidateName: candidateName,
            candidateEmail: candidateEmail,
            candidatePhone: candidatePhone,
            yearsOfExperience: 0,
            queryResponse: "Sorry, I couldn't analyze this resume properly. Please try again with a different file or query.",
            insights: ["Error processing the resume. Please check the file format and try again."]
        };
    }
};

// Export the service
// In a real application with a module bundler, you would use:
// export default AIService;
// But for this browser-based demo, we're attaching it to window
window.AIService = AIService;
