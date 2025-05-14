import CustomSVG from './CustomSVG'
import styles from './styles.module.scss'
import StartSvg from '../../../../picure/start.svg?react'
import EyeSvg from '../../../../picure/aies.svg?react'
import ForkSvg from '../../../../picure/fork.svg?react'
import IssuesSvg from '../../../../picure/issues.svg?react'

interface RepositoryIconProps {
    className?: string
    color?: string
}

// نجمة فارغة برتقالية
export const StarIcon = ({ className, color }: RepositoryIconProps) => (
    <CustomSVG className={className}>
        <StartSvg style={{ color }} />
    </CustomSVG>
)

// عين (Eye)
export const EyeIcon = ({ className, color }: RepositoryIconProps) => (
    <CustomSVG className={className}>
        <EyeSvg style={{ color }} />
    </CustomSVG>
)

// شوكة (Git Fork)
export const ForkIcon = ({ className, color }: RepositoryIconProps) => (
    <CustomSVG className={className}>
        <ForkSvg style={{ color }} />
    </CustomSVG>
)

// دائرة فارغة مع نقطة في المنتصف (Issues)
export const IssuesIcon = ({ className, color }: RepositoryIconProps) => (
    <CustomSVG className={className}>
        <IssuesSvg style={{ color }} />
    </CustomSVG>
) 