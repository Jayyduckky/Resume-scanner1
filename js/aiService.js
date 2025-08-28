// AI Service for ResumeAI Scanner
// This file integrates with an AI API for resume analysis

// Main AI Service object
const AIService = {
    // API configuration
    apiKey: '', // You'll need to add your API key
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    
    // Analyze a resume against a job description
    analyzeResume: async function(resumeText, jobDescription, queryPrompt = '') {
        try {
            // Prepare the prompt for the AI
            const prompt = this.preparePrompt(resumeText, jobDescription, queryPrompt);
            
            // Make API request to OpenAI
            const response = await this.makeAPIRequest(prompt);
            
            // Process the AI response
            return this.processAIResponse(response, queryPrompt);
        } catch (error) {
            console.error('AI Analysis Error:', error);
            return this.getFallbackResponse();
        }
    },
    
    // Prepare the prompt for AI
    preparePrompt: function(resumeText, jobDescription, queryPrompt) {
        let prompt = `
            You are an AI resume analyzer. Analyze the following resume against the job description.
            Provide a match percentage, identify matching skills, missing skills, and give insights.
            
            RESUME:
            ${resumeText}
            
            JOB DESCRIPTION:
            ${jobDescription}
        `;
        
        if (queryPrompt) {
            prompt += `
                
                SPECIFIC QUERY: ${queryPrompt}
                Please answer this specific query about the resume.
            `;
        }
        
        return prompt;
    },
    
    // Make the API request to OpenAI
    makeAPIRequest: async function(prompt) {
        // In a production environment, you would make a real API call
        // For this demo, we'll return a mock response
        
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
        
        // Mock response for demo
        return "MOCK_RESPONSE";
    },
    
    // Process the AI response
    processAIResponse: function(response, queryPrompt) {
        // For a real implementation, you would parse the actual AI response
        // For this demo, we'll create a mock result
        
        // Generate random skills that match
        const allSkills = ['JavaScript', 'Python', 'React', 'Node.js', 'HTML/CSS', 'SQL', 'Java', 'C#', 
                          'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'Git', 'Agile', 'Product Management'];
        
        const matchingSkills = [];
        const missingSkills = [];
        
        // Randomly select matching and missing skills
        allSkills.forEach(skill => {
            if (Math.random() > 0.4) {
                matchingSkills.push(skill);
            } else {
                missingSkills.push(skill);
            }
        });
        
        // Generate mock candidate information
        const candidateName = "John Smith";
        const candidateEmail = "john.smith@example.com";
        const candidatePhone = "(555) 123-4567";
        const yearsOfExperience = Math.floor(Math.random() * 10) + 1;
        const matchScore = Math.floor(Math.random() * 41) + 60; // Random score between 60-100
        
        // Generate query response
        let queryResponse = '';
        if (queryPrompt) {
            if (queryPrompt.toLowerCase().includes('name')) {
                queryResponse = `The candidate's name is <span class="query-highlight">${candidateName}</span>.`;
            } else if (queryPrompt.toLowerCase().includes('email')) {
                queryResponse = `The candidate's email is <span class="query-highlight">${candidateEmail}</span>.`;
            } else if (queryPrompt.toLowerCase().includes('phone')) {
                queryResponse = `The candidate's phone number is <span class="query-highlight">${candidatePhone}</span>.`;
            } else if (queryPrompt.toLowerCase().includes('experience')) {
                queryResponse = `The candidate has <span class="query-highlight">${yearsOfExperience} years</span> of relevant experience.`;
            } else if (queryPrompt.toLowerCase().includes('skill')) {
                queryResponse = `The candidate's key skills include <span class="query-highlight">${matchingSkills.slice(0, 5).join(', ')}</span>.`;
            } else {
                queryResponse = `I couldn't find a specific answer to your question. Please try a different query.`;
            }
        }
        
        // Generate insights
        const insights = [
            `This resume appears to be a ${matchScore > 75 ? 'strong' : 'moderate'} match for the job description with a ${matchScore}% match score.`,
            `The candidate has ${yearsOfExperience} years of experience which is ${yearsOfExperience > 3 ? 'sufficient' : 'may be insufficient'} for the position.`,
            `Key strengths include: ${matchingSkills.slice(0, 3).join(', ')}.`,
            `Areas for improvement: ${missingSkills.slice(0, 3).join(', ')}.`
        ];
        
        // Return analyzed data
        return {
            matchScore: matchScore,
            matchingSkills: matchingSkills,
            missingSkills: missingSkills,
            candidateName: candidateName,
            candidateEmail: candidateEmail,
            candidatePhone: candidatePhone,
            yearsOfExperience: yearsOfExperience,
            queryResponse: queryResponse,
            insights: insights
        };
    },
    
    // Fallback response in case of errors
    getFallbackResponse: function() {
        return {
            matchScore: 65,
            matchingSkills: ['Communication', 'Problem Solving', 'Teamwork'],
            missingSkills: ['Leadership', 'Project Management'],
            candidateName: "Unknown",
            candidateEmail: "unknown@example.com",
            candidatePhone: "Unknown",
            yearsOfExperience: 0,
            queryResponse: "Sorry, I couldn't analyze this resume. Please try again.",
            insights: ["Error processing the resume. Please check the file and try again."]
        };
    }
};

// Export the service
// In a real application with a module bundler, you would use:
// export default AIService;
// But for this browser-based demo, we're attaching it to window
window.AIService = AIService;
