import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Select, Spin, Empty, message } from 'antd';
import { SearchOutlined, StarFilled, ArrowLeftOutlined, EyeOutlined, ForkOutlined } from '@ant-design/icons';
import { useNavigate, useSearch } from '@tanstack/react-router';
import '../styles/SearchPage.css';

const { Option } = Select;

function getInitial(name) {
  return name && name.length > 0 ? name[0].toUpperCase() : '?';
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  return `${day} ${month}`;
}

const SearchPage = () => {
  const search = useSearch();
  const [searchTerm, setSearchTerm] = useState(search.org || '');
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [languages, setLanguages] = useState(['all']);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (search.org) {
      setSearchTerm(search.org);
      handleSearch(search.org);
    }
  }, [search.org]);

  const handleSearch = async (term = searchTerm) => {
    if (!term.trim()) {
      setError('Please enter an organization name');
      return;
    }

    setLoading(true);
    setError(null);
    setRepos([]);
    setLanguages([]);
    setSelectedLanguage('all');

    try {
      const token = import.meta.env.VITE_GITHUB_TOKEN;
      const headers = {
        'Accept': 'application/vnd.github.v3+json'
      };
      if (token) {
        headers['Authorization'] = `token ${token}`;
      }

      const response = await fetch(
        `https://api.github.com/orgs/${term}/repos?per_page=100`,
        { headers }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Organization not found');
        } else if (response.status === 401) {
          throw new Error(token ? 'Authentication failed. Please check your GitHub token.' : 'Authentication failed. Please use a valid GitHub token in development mode.');
        } else if (response.status === 403) {
          throw new Error(token ? 'Rate limit exceeded. Please try again later.' : 'Rate limit exceeded. Please add a GitHub token in development mode to increase the limit.');
        }
        throw new Error(`GitHub API Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.length === 0) {
        setError('No repositories found for this organization');
        return;
      }

      const uniqueLanguages = [...new Set(data
        .map(repo => repo.language)
        .filter(lang => lang !== null))];
      setLanguages(uniqueLanguages);

      const sortedRepos = data.sort((a, b) => b.stargazers_count - a.stargazers_count);
      setRepos(sortedRepos);
    } catch (error) {
      console.error('Error searching organization repos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRepos = selectedLanguage === 'all'
    ? repos
    : repos.filter(repo => repo.language === selectedLanguage);

  const handleRepoClick = (repo) => {
    navigate({
      to: '/org/$org/repo/$repo',
      params: { org: repo.owner.login, repo: repo.name },
      search: { org: searchTerm }
    });
  };

  const handleBackToSearch = () => {
    navigate({
      to: '/',
      search: { org: searchTerm }
    });
  };

  return (
    <div className="search-page">
      <div className="search-bar-row">
        <Input
          placeholder="Enter organization name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onPressEnter={() => handleSearch()}
          className="search-input-custom"
        />
        <Button
          className="search-btn-custom"
          onClick={() => handleSearch()}
          icon={<SearchOutlined style={{ fontSize: 22 }} />}
        />
      </div>
      <div className="repos-header-row">
        <h2 className="repos-title">Repositories</h2>
        {repos.length > 0 && (
          <Card className="languages-card" bordered={true} bodyStyle={{ padding: 0 }}>
            <Select
              value={selectedLanguage}
              onChange={setSelectedLanguage}
              className="languages-select"
              bordered={false}
              dropdownClassName="languages-dropdown"
            >
              {languages.map(lang => (
                <Option key={lang} value={lang}>
                  {lang === 'all' ? 'Languages' : lang}
                </Option>
              ))}
            </Select>
          </Card>
        )}
      </div>
      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      ) : (
        <div className="repos-list-custom">
          {filteredRepos.length > 0 ? (
            filteredRepos.map(repo => (
              <Card
                key={repo.id}
                className="repo-card-custom"
                bordered={true}
                bodyStyle={{ padding: 20 }}
                onClick={() => handleRepoClick(repo)}
                style={{ cursor: 'pointer' }}
              >
                <div className="repo-card-content">
                  {repo.owner.avatar_url ? (
                    <img
                      src={repo.owner.avatar_url}
                      alt={repo.owner.login}
                      className="repo-avatar-large"
                    />
                  ) : (
                    <div className="repo-avatar-fallback">
                      {getInitial(repo.name)}
                    </div>
                  )}
                  <div className="repo-main-info">
                    <div className="repo-name-custom">{repo.name}</div>
                    <div className="repo-owner-custom">{repo.owner.login}</div>
                    <div className="repo-meta-row">
                      <span className="repo-stars-custom">
                        <StarFilled style={{ color: '#FFA940', marginRight: 4, fontSize: 18 }} />
                        {repo.stargazers_count}
                      </span>
                      <span className="repo-watchers-custom">
                        <EyeOutlined style={{ marginRight: 4 }} />
                        {repo.watchers_count}
                      </span>
                      <span className="repo-forks-custom">
                        <ForkOutlined style={{ marginRight: 4 }} />
                        {repo.forks_count}
                      </span>
                      <span className="repo-updated-custom">
                        Updated {formatDate(repo.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Empty description="No repositories found" />
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage; 