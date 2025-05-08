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

interface Project {
    id: number;
    name: string;
    body: string;
    html_url: string;
}

interface ContributionDay {
    date: string;
    count: number;
    color: string;
    level: number;
}

export const UserDetails: React.FC = () => {
    const { org, repo } = useParams({ from: '/org/$org/repo/$repo' });
    const [repoData, setRepoData] = useState<Repo | null>(null);
    const [contributors, setContributors] = useState<Contributor[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [contributions, setContributions] = useState<ContributionDay[]>([]);

    // جلب جميع الفروع مع pagination
    const fetchAllBranches = async () => {
        let allBranches: Branch[] = [];
        let page = 1;
        try {
            while (true) {
                const res = await fetch(`https://api.github.com/repos/${org}/${repo}/branches?per_page=100&page=${page}`, {
                    headers,
                    method: 'GET'
                });

                if (!res.ok) {
                    console.warn('Failed to fetch branches page:', res.status);
                    break;
                }

                const data = await res.json();
                if (data.length === 0) break;

                allBranches = allBranches.concat(data);
                if (data.length < 100) break;
                page++;
            }
        } catch (e) {
            console.error('Error fetching branches:', e);
        }
        return allBranches;
    };

    // جلب بيانات شبكة المساهمات من github-contributions-api
    const fetchContributions = async (username: string) => {
        try {
            const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}`);
            if (!res.ok) return;
            const data = await res.json();
            // Flatten all weeks into one array of days
            const days: ContributionDay[] = data.weeks.flatMap((week: any) => week.contributionDays);
            setContributions(days);
        } catch (e) {
            setContributions([]);
        }
    };

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            setError('');
            try {
                // جلب بيانات الريبو
                const repoRes = await fetch(`https://api.github.com/repos/${org}/${repo}`, {
                    headers,
                    method: 'GET'
                });

                if (!repoRes.ok) {
                    const errorData = await repoRes.json().catch(() => null);
                    console.error('GitHub API Error:', {
                        status: repoRes.status,
                        statusText: repoRes.statusText,
                        error: errorData
                    });
                    throw new Error(`GitHub API Error: ${repoRes.status} ${repoRes.statusText}`);
                }

                const repoJson = await repoRes.json();
                setRepoData(repoJson);

                // جلب المساهمين
                const contribRes = await fetch(`https://api.github.com/repos/${org}/${repo}/contributors?per_page=10`, {
                    headers,
                    method: 'GET'
                });

                if (contribRes.ok) {
                    const contribData = await contribRes.json();
                    setContributors(contribData);
                } else {
                    console.warn('Failed to fetch contributors:', contribRes.status);
                    setContributors([]);
                }

                // جلب جميع الفروع
                const allBranches = await fetchAllBranches();
                setBranches(allBranches);

                // جلب المشاريع (Projects)
                const projectsRes = await fetch(`https://api.github.com/repos/${org}/${repo}/projects`, {
                    headers: {
                        ...headers,
                        'Accept': 'application/vnd.github.inertia-preview+json',
                    },
                    method: 'GET'
                });

                if (projectsRes.ok) {
                    const projectsData = await projectsRes.json();
                    setProjects(projectsData);
                } else {
                    console.warn('Failed to fetch projects:', projectsRes.status);
                    setProjects([]);
                }

                if (repoJson?.owner?.login) {
                    fetchContributions(repoJson.owner.login);
                }
            } catch (e) {
                console.error('Error in fetchAll:', e);
                setError(e instanceof Error ? e.message : 'Repository not found or API error');
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [org, repo]);

    // جلب العدد الكلي للمساهمين من repoData إذا متاح
    const contributorsCount = (repoData as any)?.contributors_count || contributors.length;

    if (loading) return <div>Loading...</div>;
    if (error || !repoData) return <div style={{ color: 'red' }}>{error || 'Repository not found'}</div>;

    return (
        <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
            {/* زر زيارة صفحة الريبو على GitHub */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <a href={`https://github.com/${org}/${repo}`} target="_blank" rel="noopener noreferrer" style={{
                    background: '#222', color: '#fff', padding: '7px 18px', borderRadius: 8, textDecoration: 'none', fontWeight: 500, fontSize: 15
                }}>
                    Visit on GitHub ↗
                </a>
            </div>
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
            {/* المساهمات (شبكة تفاعلية) */}
            <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 4 }}>Contributions</div>
            <div style={{ marginBottom: 18, overflowX: 'auto' }}>
                {contributions.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                        {/* 53 أسبوع (أعمدة) */}
                        {Array.from({ length: 53 }).map((_, weekIdx) => (
                            <div key={weekIdx} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {Array.from({ length: 7 }).map((_, dayIdx) => {
                                    const day = contributions[weekIdx * 7 + dayIdx];
                                    if (!day) return <div key={dayIdx} style={{ width: 12, height: 12 }} />;
                                    return (
                                        <div
                                            key={dayIdx}
                                            title={`${day.count} contributions on ${day.date}`}
                                            style={{
                                                width: 12,
                                                height: 12,
                                                background: day.color,
                                                borderRadius: 2,
                                                border: '1px solid #eee',
                                                transition: 'background 0.2s',
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                ) : (
                    <span style={{ color: '#888' }}>No contributions data.</span>
                )}
            </div>
            {/* المساهمون */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 'bold', fontSize: 18 }}>Contributors</span>
                <span style={{ background: '#222', color: '#fff', borderRadius: 12, fontSize: 13, fontWeight: 600, padding: '2px 10px', marginLeft: 4 }}>{contributorsCount}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                {contributors.slice(0, 12).map((c, i) => (
                    <a
                        key={i}
                        href={`https://github.com/${c.login}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={c.login}
                        style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                    >
                        {c.avatar_url ? (
                            <img src={c.avatar_url} alt={c.login} style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #fff', objectFit: 'cover', background: '#222' }} />
                        ) : (
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#222', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18 }}>{c.login[0].toUpperCase()}</div>
                        )}
                    </a>
                ))}
                {contributorsCount > 12 && (
                    <a
                        href={`https://github.com/${org}/${repo}/contributors`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontWeight: 500, fontSize: 15, color: '#1976d2', marginLeft: 8, textDecoration: 'none' }}
                    >
                        + {contributorsCount - 12} contributors
                    </a>
                )}
            </div>
            {/* الفروع */}
            <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 4 }}>Branches List</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 18 }}>
                {branches.length === 0 && <span>No branches.</span>}
                {branches.map((b, i) => (
                    <div key={i} style={{ color: b.protected ? '#888' : '#222', fontWeight: b.protected ? 400 : 500 }}>
                        {b.name} {b.protected && <span style={{ fontSize: 13, color: '#888' }}>• PROTECTED</span>}
                    </div>
                ))}
            </div>
            {/* المشاريع */}
            <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 4 }}>Projects</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {projects.length === 0 && <span>No projects.</span>}
                {projects.map((p) => (
                    <a key={p.id} href={p.html_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', fontWeight: 500, textDecoration: 'none', fontSize: 16, border: '1px solid #eee', borderRadius: 8, padding: 8, marginBottom: 4 }}>
                        <div style={{ fontWeight: 'bold', fontSize: 17 }}>{p.name}</div>
                        <div style={{ color: '#444', fontSize: 15 }}>{p.body}</div>
                    </a>
                ))}
            </div>
        </div>
    );
}; 