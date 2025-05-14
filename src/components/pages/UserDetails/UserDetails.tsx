import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { StarIcon, EyeIcon, ForkIcon, IssuesIcon } from '../../ui/CustomSVG/RepositoryIcons';
import styles from '../../ui/CustomSVG/styles.module.scss';
import GitHubCalendar from 'react-github-calendar';
import ContributionGraph from '../ContributionGraph';

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
    const navigate = useNavigate();
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

    // ألوان شبكة المساهمات
    const getContributionColor = (count: number) => {
        if (count === 0) return '#E0E0E0'; // رمادي فاتح
        if (count === 1) return '#A7F3D0'; // أخضر فاتح
        if (count <= 5) return '#34D399'; // أخضر متوسط
        return '#059669'; // أخضر غامق
    };

    // مفتاح الألوان (legend)
    const legend = [
        { color: '#A7F3D0', label: '1 commit' },
        { color: '#34D399', label: '2-5 commits' },
        { color: '#059669', label: '>5 commits' },
        { color: '#E0E0E0', label: '0 commits' },
    ];

    return (
        <div style={{ maxWidth: 340, margin: '0 auto', padding: 8, background: '#fff' }}>
            {/* رأس الصفحة */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <button onClick={() => navigate({ to: '/', search: { org } })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginRight: 2 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                {repoData.owner?.avatar_url ? (
                    <img src={repoData.owner.avatar_url} alt={repoData.name} style={{ width: 32, height: 32, borderRadius: '50%', background: '#f66' }} />
                ) : (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f66', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 'bold' }}>{repoData.name[0].toUpperCase()}</div>
                )}
                <div style={{ fontWeight: 700, fontSize: 18, color: '#222', marginLeft: 4 }}>{repoData.name}</div>
            </div>
            {/* الإحصائيات */}
            <div className={styles.iconsRowContainer}>
                <span className={`repo-stars-custom ${styles.iconLabel}`}>
                    <StarIcon />
                    <span className={styles.iconText}>{repoData.stargazers_count}</span>
                </span>
                <span className={`repo-watchers-custom ${styles.iconLabel}`}>
                    <EyeIcon />
                    <span className={styles.iconText}>{repoData.watchers_count}</span>
                </span>
                <span className={`repo-forks-custom ${styles.iconLabel}`}>
                    <ForkIcon />
                    <span className={styles.iconText}>{repoData.forks_count}</span>
                </span>
                <span className={`repo-issues-custom ${styles.iconLabel}`}>
                    <IssuesIcon />
                    <span className={styles.iconText}>{repoData.open_issues_count}</span>
                </span>
            </div>
            {/* الوصف */}
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2, marginTop: 8 }}>Description</div>
            <div style={{ marginBottom: 8, fontSize: 13, color: '#222' }}>{repoData.description || 'No description.'}</div>
            {/* شبكة المساهمات */}
            <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 4 }}>Contributions</div>
            <ContributionGraph />
            {/* المساهمون */}
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>Contributors</div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
                {contributors.slice(0, 12).map((c, i) => (
                    <a
                        key={i}
                        href={`https://github.com/${c.login}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ width: 22, height: 22, borderRadius: '50%', background: '#FF5C5C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, border: '1.5px solid #fff', overflow: 'hidden', textDecoration: 'none' }}
                    >
                        {c.avatar_url ? <img src={c.avatar_url} alt={c.login} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.login[0].toUpperCase()}
                    </a>
                ))}
            </div>
            {/* قائمة الفروع */}
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>Branches List</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 10 }}>
                {branches.length === 0 && <span style={{ fontSize: 12 }}>No branches.</span>}
                {branches.map((b, i) => (
                    <div key={i} style={{ color: b.protected ? '#aaa' : '#222', fontWeight: 500, fontSize: 13, display: 'flex', alignItems: 'center', gap: 3 }}>
                        {b.name} {b.protected && <span style={{ fontSize: 11, color: '#aaa', marginLeft: 2 }}>• PROTECTED</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}; 