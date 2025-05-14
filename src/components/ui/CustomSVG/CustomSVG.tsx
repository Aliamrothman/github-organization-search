import React from 'react'
import styles from './styles.module.scss'

interface CustomSVGProps {
  children: React.ReactNode
  className?: string
}

const CustomSVG: React.FC<CustomSVGProps> = ({ children, className }) => {
  return (
    <div className={`${styles.customSvgRoot} ${className || ''}`}>
      {children}
    </div>
  )
}

export default CustomSVG
