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
        // أولاً، نتحقق من وجود المنظمة
        const orgResponse = await axios.get(`https://api.github.com/orgs/${encodeURIComponent(orgName)}`, { headers });
        
        // ثم نجلب الريبوهات
        const response = await axios.get(`https://api.github.com/orgs/${encodeURIComponent(orgName)}/repos`, { headers });
        return response.data;
    } catch (error) {
        console.error('Error searching organization repos:', error);
        if (error.response) {
            if (error.response.status === 404) {
                throw new Error('Organization not found');
            }
            throw new Error(`GitHub API Error: ${error.response.status}`);
        }
        throw error;
    }
};