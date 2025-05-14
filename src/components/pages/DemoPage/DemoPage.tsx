import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '../../dummies/Card/Card';
import { Input } from '../../ui/Input/Input';
import { IconButton } from '../../ui/IconButton/IconButton';
import styles from './DemoPage.module.scss';
import { searchOrganizationRepos, GitHubRepo } from '../../../services/github';
import { format } from 'date-fns';
import { useNavigate } from '@tanstack/react-router';
import { Select } from 'antd';

export const DemoPage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('all');
    const [languages, setLanguages] = useState<string[]>(['all']);
    const navigate = useNavigate();

    // استعادة نتائج البحث عند تحميل الصفحة
    useEffect(() => {
        const savedResults = localStorage.getItem('searchResults');
        const savedQuery = localStorage.getItem('searchQuery');
        const savedLanguages = localStorage.getItem('languages');
        const savedSelectedLanguage = localStorage.getItem('selectedLanguage');

        if (savedResults && savedQuery) {
            setRepos(JSON.parse(savedResults));
            setSearchQuery(savedQuery);
            setHasSearched(true);

            if (savedLanguages) {
                setLanguages(JSON.parse(savedLanguages));
            }
            if (savedSelectedLanguage) {
                setSelectedLanguage(savedSelectedLanguage);
            }
        }
    }, []);

    // مراقبة حدث الرجوع
    useEffect(() => {
        const handlePopState = () => {
            const savedResults = localStorage.getItem('searchResults');
            const savedQuery = localStorage.getItem('searchQuery');
            const savedLanguages = localStorage.getItem('languages');
            const savedSelectedLanguage = localStorage.getItem('selectedLanguage');

            if (savedResults && savedQuery) {
                setRepos(JSON.parse(savedResults));
                setSearchQuery(savedQuery);
                setHasSearched(true);

                if (savedLanguages) {
                    setLanguages(JSON.parse(savedLanguages));
                }
                if (savedSelectedLanguage) {
                    setSelectedLanguage(savedSelectedLanguage);
                }
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // حفظ النتائج عند تغييرها
    useEffect(() => {
        if (repos.length > 0) {
            localStorage.setItem('searchResults', JSON.stringify(repos));
            localStorage.setItem('searchQuery', searchQuery);
            localStorage.setItem('languages', JSON.stringify(languages));
            localStorage.setItem('selectedLanguage', selectedLanguage);
        }
    }, [repos, searchQuery, languages, selectedLanguage]);

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setHasSearched(true);
        try {
            const results = await searchOrganizationRepos(searchQuery);
            setRepos(results);
            const uniqueLanguages = Array.from(new Set(results.map(r => r.language).filter(Boolean)));
            setLanguages(['all', ...uniqueLanguages]);
            setSelectedLanguage('all');
        } catch (error) {
            console.error('Error fetching repos:', error);
            setRepos([]);
            setLanguages(['all']);
            setSelectedLanguage('all');
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleRepoClick = (repo: GitHubRepo) => {
        // حفظ النتائج قبل الانتقال
        localStorage.setItem('searchResults', JSON.stringify(repos));
        localStorage.setItem('searchQuery', searchQuery);
        localStorage.setItem('languages', JSON.stringify(languages));
        localStorage.setItem('selectedLanguage', selectedLanguage);

        navigate({
            to: '/org/$org/repo/$repo',
            params: { org: repo.owner.login, repo: repo.name }
        });
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'dd MMM');
        } catch (error) {
            return 'Unknown date';
        }
    };

    // فلترة الريبو حسب اللغة
    const filteredRepos = selectedLanguage === 'all' ? repos : repos.filter(r => r.language === selectedLanguage);

    return (
        <div className={styles.container}>
            <div className={styles.searchBox}>
                <Input
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Enter organization name"
                    onKeyDown={handleKeyDown}
                />
                <IconButton
                    icon={
                        isLoading ? (
                            <div className={styles.loader} />
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z"
                                    fill="currentColor"
                                />
                            </svg>
                        )
                    }
                    onClick={handleSearch}
                    disabled={isLoading || !searchQuery.trim()}
                />
            </div>

            {/* فلتر اللغة مع العنوان */}
            {repos.length > 0 && (
                <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 18 }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#222' }}>Repositories</h2>
                    <Select
                        value={selectedLanguage}
                        onChange={setSelectedLanguage}
                        style={{ minWidth: 180, height: 48, borderRadius: 12 }}
                        dropdownStyle={{ borderRadius: 12 }}
                        className={styles.languageSelect}
                    >
                        {languages.map(lang => (
                            <Select.Option key={lang} value={lang}>
                                {lang === 'all' ? 'Languages' : lang}
                            </Select.Option>
                        ))}
                    </Select>
                </div>
            )}

            <div className={styles.results}>
                {hasSearched && !isLoading && filteredRepos.length === 0 && (
                    <div className={styles.notFound}>Not Found</div>
                )}
                {filteredRepos.map((repo) => (
                    <Card
                        key={repo.id}
                        avatar={repo.owner.avatar_url || repo.name[0].toUpperCase()}
                        name={repo.name}
                        userName={repo.owner.login}
                        stars={repo.stargazers_count}
                        updatedAt={formatDate(repo.updated_at)}
                        onClick={() => handleRepoClick(repo)}
                    />
                ))}
            </div>
        </div>
    );
}; 