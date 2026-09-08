import { motion } from 'framer-motion'

interface AlmaLogoProps {
  level: 1 | 2 | 3 | 4 | 5
  size?: number
  animate?: boolean
}

const levelColors = {
  1: {
    primary: '#FFD700',
    secondary: '#FFA500',
    glow: 'rgba(255, 215, 0, 0.4)',
  },
  2: {
    primary: '#FF8C00',
    secondary: '#FF6347',
    glow: 'rgba(255, 140, 0, 0.5)',
  },
  3: {
    primary: '#DC143C',
    secondary: '#8B008B',
    glow: 'rgba(220, 20, 60, 0.6)',
  },
  4: {
    primary: '#8B008B',
    secondary: '#4B0082',
    glow: 'rgba(139, 0, 139, 0.7)',
  },
  5: {
    primary: '#4B0082',
    secondary: '#1E3A8A',
    glow: 'rgba(30, 58, 138, 0.8)',
  },
}

export default function AlmaLogo({ level, size = 200, animate = true }: AlmaLogoProps) {
  const colors = levelColors[level]
  const intensity = level * 0.2

  const shapes = [
    // Top center
    { cx: size * 0.5, cy: size * 0.15, rx: size * 0.15, ry: size * 0.08 },
    // Left upper
    { cx: size * 0.2, cy: size * 0.25, rx: size * 0.12, ry: size * 0.1 },
    // Right upper
    { cx: size * 0.8, cy: size * 0.25, rx: size * 0.12, ry: size * 0.1 },
    // Left middle
    { cx: size * 0.15, cy: size * 0.5, rx: size * 0.1, ry: size * 0.15 },
    // Center
    { cx: size * 0.5, cy: size * 0.5, rx: size * 0.18, ry: size * 0.12 },
    // Right middle
    { cx: size * 0.85, cy: size * 0.5, rx: size * 0.1, ry: size * 0.15 },
    // Left lower
    { cx: size * 0.25, cy: size * 0.75, rx: size * 0.13, ry: size * 0.1 },
    // Center lower
    { cx: size * 0.5, cy: size * 0.8, rx: size * 0.15, ry: size * 0.12 },
    // Right lower
    { cx: size * 0.75, cy: size * 0.75, rx: size * 0.13, ry: size * 0.1 },
  ]

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      initial={animate ? { opacity: 0, scale: 0.8 } : {}}
      animate={animate ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6 }}
    >
      <defs>
        <radialGradient id={`alma-gradient-${level}`}>
          <stop offset="0%" stopColor={colors.primary} stopOpacity={intensity + 0.3} />
          <stop offset="100%" stopColor={colors.secondary} stopOpacity={intensity} />
        </radialGradient>
        <filter id={`glow-${level}`}>
          <feGaussianBlur stdDeviation={4 + level * 2} result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {shapes.map((shape, index) => (
        <motion.ellipse
          key={index}
          cx={shape.cx}
          cy={shape.cy}
          rx={shape.rx}
          ry={shape.ry}
          fill={`url(#alma-gradient-${level})`}
          filter={`url(#glow-${level})`}
          opacity={0.7 + intensity}
          initial={animate ? { scale: 0 } : {}}
          animate={
            animate
              ? {
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, 0],
                }
              : {}
          }
          transition={{
            duration: 3 + index * 0.2,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: index * 0.1,
          }}
        />
      ))}

      {/* Connecting curves */}
      {level >= 3 && (
        <>
          <motion.path
            d={`M ${size * 0.2} ${size * 0.25} Q ${size * 0.35} ${size * 0.4} ${size * 0.5} ${size * 0.5}`}
            stroke={colors.primary}
            strokeWidth={2}
            fill="none"
            opacity={0.3 + intensity * 0.5}
            filter={`url(#glow-${level})`}
            animate={
              animate
                ? {
                    pathLength: [0, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }
                : {}
            }
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
          <motion.path
            d={`M ${size * 0.8} ${size * 0.25} Q ${size * 0.65} ${size * 0.4} ${size * 0.5} ${size * 0.5}`}
            stroke={colors.secondary}
            strokeWidth={2}
            fill="none"
            opacity={0.3 + intensity * 0.5}
            filter={`url(#glow-${level})`}
            animate={
              animate
                ? {
                    pathLength: [0, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }
                : {}
            }
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: 0.5,
            }}
          />
        </>
      )}
    </motion.svg>
  )
}
