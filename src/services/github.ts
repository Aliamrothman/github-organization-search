export interface GitHubRepo {
    id: number;
    name: string;
    owner: { login: string; avatar_url: string };
    stargazers_count: number;
    updated_at: string;
    language: string;
}

const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json'
};

// إضافة التوكن إذا كان متوفراً
if (import.meta.env.VITE_GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`;
}

export async function searchOrganizationRepos(org: string): Promise<GitHubRepo[]> {
    if (!org) return [];
    try {
        // أولاً، نتحقق من وجود المنظمة
        const orgResponse = await fetch(`https://api.github.com/orgs/${encodeURIComponent(org)}`, { headers });
        if (!orgResponse.ok) {
            if (orgResponse.status === 404) {
                throw new Error('Organization not found');
            }
            throw new Error(`GitHub API Error: ${orgResponse.status}`);
        }

        // ثم نجلب الريبوهات
        const response = await fetch(`https://api.github.com/orgs/${encodeURIComponent(org)}/repos`, { headers });
        if (!response.ok) {
            throw new Error(`GitHub API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.map((repo: any) => ({
            id: repo.id,
            name: repo.name,
            owner: repo.owner,
            stargazers_count: repo.stargazers_count,
            updated_at: repo.updated_at,
            language: repo.language,
        }));
    } catch (error) {
        console.error('Error searching organization repos:', error);
        throw error;
    }
} 