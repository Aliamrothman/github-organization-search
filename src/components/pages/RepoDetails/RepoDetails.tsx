import React, { useEffect, useState } from 'react';
import { useParams } from '@tanstack/react-router';

const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json'
};
if (import.meta.env.VITE_GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`;
}

interface Repo {
    name: string;
    owner: { login: string; avatar_url: string };
    description: string;
    stargazers_count: number;
    watchers_count: number;
    forks_count: number;
    open_issues_count: number;
}

interface Contributor {
    login: string;
    avatar_url: string;
}

interface Branch {
    name: string;
    protected: boolean;
}

export const RepoDetails: React.FC = () => {
    const { org, repo } = useParams({ from: '/org/$org/repo/$repo' });
    const [repoData, setRepoData] = useState<Repo | null>(null);
    const [contributors, setContributors] = useState<Contributor[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            setError('');
            try {
                // جلب بيانات الريبو
                const repoRes = await fetch(`https://api.github.com/repos/${org}/${repo}`, { headers });
                if (!repoRes.ok) throw new Error('Repository not found');
                const repoJson = await repoRes.json();
                setRepoData(repoJson);

                // جلب المساهمين
                const contribRes = await fetch(`https://api.github.com/repos/${org}/${repo}/contributors?per_page=10`, { headers });
                setContributors(contribRes.ok ? await contribRes.json() : []);

                // جلب الفروع
                const branchesRes = await fetch(`https://api.github.com/repos/${org}/${repo}/branches?per_page=10`, { headers });
                setBranches(branchesRes.ok ? await branchesRes.json() : []);
            } catch (e) {
                setError('Repository not found or API error');
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [org, repo]);

    if (loading) return <div>Loading...</div>;
    if (error || !repoData) return <div style={{ color: 'red' }}>{error || 'Repository not found'}</div>;

    return (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
            {/* رأس الريبو */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                {repoData.owner?.avatar_url ? (
                    <img src={repoData.owner.avatar_url} alt={repoData.name} style={{ width: 48, height: 48, borderRadius: '50%', background: '#f66' }} />
                ) : (
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f66', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 'bold' }}>{repoData.name[0].toUpperCase()}</div>
                )}
                <div style={{ fontWeight: 'bold', fontSize: 22 }}>{repoData.name}</div>
            </div>
            {/* إحصائيات */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18, fontSize: 18 }}>
                <span style={{ color: '#ffb400', display: 'flex', alignItems: 'center', gap: 4 }}>★{repoData.stargazers_count}</span>
                <span style={{ color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>👁️{repoData.watchers_count}</span>
                <span style={{ color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>🍴{repoData.forks_count}</span>
                <span style={{ color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>🐞{repoData.open_issues_count}</span>
            </div>
            {/* الوصف */}
            <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 4 }}>Description</div>
            <div style={{ marginBottom: 18 }}>{repoData.description || 'No description.'}</div>
            {/* المساهمات (صورة من GitHub) */}
            <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 4 }}>Contributions</div>
            <img src={`https://ghchart.rshah.org/${repoData.owner.login}`} alt="contributions" style={{ width: '100%', maxWidth: 500, marginBottom: 18 }} />
            {/* المساهمون */}
            <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 4 }}>Contributors</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                {contributors.length === 0 && <span>No contributors.</span>}
                {contributors.map(c => (
                    <div key={c.login} style={{ width: 36, height: 36, borderRadius: '50%', background: '#f66', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18, border: '2px solid #fff', overflow: 'hidden' }}>
                        {c.avatar_url ? <img src={c.avatar_url} alt={c.login} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.login[0].toUpperCase()}
                    </div>
                ))}
            </div>
            {/* الفروع */}
            <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 4 }}>Branches List</div>
            <div>
                {branches.length === 0 && <span>No branches.</span>}
                {branches.map(b => (
                    <div key={b.name} style={{ color: b.protected ? '#888' : '#222', fontWeight: b.protected ? 600 : 400, marginBottom: 2 }}>
                        {b.name} {b.protected && <span style={{ fontSize: 12, color: '#888' }}>• PROTECTED</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}; 