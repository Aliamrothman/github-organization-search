import React, { useState, useEffect } from 'react';
import { Card, Spin, Empty, message } from 'antd';
import { useParams, useNavigate, useSearch } from '@tanstack/react-router';
import { ArrowLeftOutlined, StarFilled, EyeOutlined, ForkOutlined } from '@ant-design/icons';
import '../styles/RepoPage.css';

function getInitial(name) {
    return name && name.length > 0 ? name[0].toUpperCase() : '?';
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    return `${day} ${month}`;
}

const RepoPage = () => {
    const { org, repo } = useParams();
    const search = useSearch();
    const [repoData, setRepoData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRepoData = async () => {
            try {
                const token = import.meta.env.VITE_GITHUB_TOKEN;
                const headers = {
                    'Accept': 'application/vnd.github.v3+json'
                };
                if (token) {
                    headers['Authorization'] = `token ${token}`;
                }

                const response = await fetch(
                    `https://api.github.com/repos/${org}/${repo}`,
                    { headers }
                );

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Repository not found');
                    } else if (response.status === 401) {
                        throw new Error(token ? 'Authentication failed. Please check your GitHub token.' : 'Authentication failed. Please use a valid GitHub token in development mode.');
                    } else if (response.status === 403) {
                        throw new Error(token ? 'Rate limit exceeded. Please try again later.' : 'Rate limit exceeded. Please add a GitHub token in development mode to increase the limit.');
                    }
                    throw new Error(`GitHub API Error: ${response.status}`);
                }

                const data = await response.json();
                setRepoData(data);
            } catch (error) {
                console.error('Error fetching repository:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRepoData();
    }, [org, repo]);

    const handleBackToSearch = () => {
        navigate({
            to: '/',
            search: { org: search.org }
        });
    };

    if (loading) {
        return (
            <div className="loading-container">
                <Spin size="large" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <Empty description={error} />
            </div>
        );
    }

    if (!repoData) {
        return (
            <div className="error-container">
                <Empty description="Repository not found" />
            </div>
        );
    }

    return (
        <div className="repo-page">
            <div className="back-button" onClick={handleBackToSearch}>
                <ArrowLeftOutlined />
                <span>Back to Search</span>
            </div>
            <Card className="repo-card-custom" bordered={true}>
                <div className="repo-card-content">
                    {repoData.owner.avatar_url ? (
                        <img
                            src={repoData.owner.avatar_url}
                            alt={repoData.owner.login}
                            className="repo-avatar-large"
                        />
                    ) : (
                        <div className="repo-avatar-fallback">
                            {getInitial(repoData.name)}
                        </div>
                    )}
                    <div className="repo-main-info">
                        <div className="repo-name-custom">{repoData.name}</div>
                        <div className="repo-owner-custom">{repoData.owner.login}</div>
                        <div className="repo-meta-row">
                            <span className="repo-stars-custom">
                                <StarFilled style={{ color: '#FFA940', marginRight: 4, fontSize: 18 }} />
                                {repoData.stargazers_count}
                            </span>
                            <span className="repo-watchers-custom">
                                <EyeOutlined style={{ marginRight: 4 }} />
                                {repoData.watchers_count}
                            </span>
                            <span className="repo-forks-custom">
                                <ForkOutlined style={{ marginRight: 4 }} />
                                {repoData.forks_count}
                            </span>
                            <span className="repo-updated-custom">
                                Updated {formatDate(repoData.updated_at)}
                            </span>
                        </div>
                    </div>
                </div>
                {repoData.description && (
                    <div className="repo-description">
                        {repoData.description}
                    </div>
                )}
                <div className="repo-details">
                    <div className="repo-detail-item">
                        <span className="detail-label">Language:</span>
                        <span className="detail-value">{repoData.language || 'Not specified'}</span>
                    </div>
                    <div className="repo-detail-item">
                        <span className="detail-label">Created:</span>
                        <span className="detail-value">{formatDate(repoData.created_at)}</span>
                    </div>
                    <div className="repo-detail-item">
                        <span className="detail-label">Last Push:</span>
                        <span className="detail-value">{formatDate(repoData.pushed_at)}</span>
                    </div>
                    <div className="repo-detail-item">
                        <span className="detail-label">Size:</span>
                        <span className="detail-value">{repoData.size} KB</span>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default RepoPage; 