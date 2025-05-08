import axios from 'axios';

const headers = {
    'Accept': 'application/vnd.github.v3+json'
};

if (import.meta.env.VITE_GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`;
}

export const searchOrganizationRepos = async (orgName) => {
    if (!orgName) return [];
    try {
        // نجلب الريبوهات مباشرة
        const response = await axios.get(`https://api.github.com/orgs/${encodeURIComponent(orgName)}/repos`, { 
            headers,
            params: {
                sort: 'updated',
                per_page: 100
            }
        });
        
        if (!response.data || response.data.length === 0) {
            throw new Error('Organization not found');
        }
        
        return response.data;
    } catch (error) {
        console.error('Error searching organization repos:', error);
        if (error.response) {
            if (error.response.status === 404) {
                throw new Error('Organization not found');
            }
            if (error.response.status === 403) {
                throw new Error('Rate limit exceeded. Please try again later.');
            }
            throw new Error(`GitHub API Error: ${error.response.status}`);
        }
        throw error;
    }
};