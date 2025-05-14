import React from 'react';
import styles from './Card.module.scss';
import StartSvg from '../../../../picure/start.svg?react';

export type CardProps = {
  avatar: string;
  name: string;
  userName: string;
  stars: number;
  updatedAt: string;
  onClick?: () => void;
  className?: string;
};

export const Card: React.FC<CardProps> = ({
  avatar,
  name,
  userName,
  stars,
  updatedAt,
  onClick,
  className = '',
}) => {
  return (
    <div className={`${styles.card} ${className}`} onClick={onClick}>
      <div className={styles.avatar}>
        {avatar.startsWith('http') ? (
          <img src={avatar} alt={name} />
        ) : (
          <div className={styles.placeholder}>{avatar[0].toUpperCase()}</div>
        )}
      </div>
      <div className={styles.info}>
        <div className={styles.name}>{name}</div>
        <div className={styles.userName}>{userName}</div>
        <div className={styles.stats}>
          <span className={styles.stars} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <StartSvg style={{ width: 14, height: 14, color: '#FFB800' }} />
            <span style={{ color: '#8c8c8c', fontWeight: 500, fontFamily: 'Roboto, sans-serif' }}>{stars}</span>
          </span>
          <span className={styles.updated} style={{ fontSize: 13, color: '#8c8c8c', fontFamily: 'Roboto, sans-serif' }}>
            Updated {updatedAt}
          </span>
        </div>
      </div>
    </div>
  );
};
