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
        // Extract basic information from resume
        const lines = resumeText.split('\n');
        
        // Extract candidate name (typically at the top of the resume)
        let candidateName = "Unknown";
        for (let i = 0; i < Math.min(10, lines.length); i++) {
            const line = lines[i].trim();
            // Look for a name-like pattern (2-3 words, each starting with uppercase)
            if (/^[A-Z][a-z]+([ \-][A-Z][a-z]+){1,2}$/.test(line) && line.length < 30) {
                candidateName = line;
                break;
            }
        }
        
        // Extract email (look for email pattern)
        let candidateEmail = "Unknown";
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
        const emailMatch = resumeText.match(emailRegex);
        if (emailMatch) {
            candidateEmail = emailMatch[0];
        }
        
        // Extract phone number
        let candidatePhone = "Unknown";
        const phoneRegex = /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
        const phoneMatch = resumeText.match(phoneRegex);
        if (phoneMatch) {
            candidatePhone = phoneMatch[0];
        }
        
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
        if (queryPrompt.toLowerCase().includes('name')) {
            queryResponse = `The candidate's name is <span class="query-highlight">${candidateName}</span>.`;
        } else if (queryPrompt.toLowerCase().includes('email')) {
            queryResponse = `The candidate's email is <span class="query-highlight">${candidateEmail}</span>.`;
        } else if (queryPrompt.toLowerCase().includes('phone')) {
            queryResponse = `The candidate's phone number is <span class="query-highlight">${candidatePhone}</span>.`;
        } else if (queryPrompt.toLowerCase().includes('experience')) {
            queryResponse = `The candidate has approximately <span class="query-highlight">${yearsOfExperience} years</span> of professional experience.`;
        } else if (queryPrompt.toLowerCase().includes('skill')) {
            queryResponse = `The candidate's key skills include <span class="query-highlight">${matchingSkills.slice(0, 7).join(', ')}</span>.`;
        } else {
            // For other queries, we'd use the AI response
            queryResponse = `Based on the resume, ${queryPrompt} appears to be related to ${candidateName}'s background. For more specific information, please try asking about their name, email, phone, experience, or skills.`;
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
