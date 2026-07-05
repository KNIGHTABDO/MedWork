interface IconProps {
  size?: number
  strokeWidth?: number
}

function base(size: number) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
}

export const TimerIcon = ({ size = 22, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size)} strokeWidth={strokeWidth}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9.5V13l2.5 2" />
    <path d="M9.5 3h5" />
  </svg>
)

export const TasksIcon = ({ size = 22, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size)} strokeWidth={strokeWidth}>
    <path d="M4 6.5l1.5 1.5L8.5 5" />
    <path d="M4 13l1.5 1.5L8.5 11.5" />
    <path d="M4 19.5L5.5 21 8.5 18" />
    <path d="M12 7h8M12 13.5h8M12 20h8" />
  </svg>
)

export const MusicIcon = ({ size = 22, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size)} strokeWidth={strokeWidth}>
    <circle cx="7" cy="17.5" r="2.8" />
    <circle cx="17.5" cy="15.5" r="2.8" />
    <path d="M9.8 17.5V6.5l10.5-2v11" />
  </svg>
)

export const SceneIcon = ({ size = 22, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size)} strokeWidth={strokeWidth}>
    <rect x="3" y="4.5" width="18" height="15" rx="3" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="M3.5 17l4.8-4.5 3.2 3 3.5-3.5 5.5 5" />
  </svg>
)

export const GearIcon = ({ size = 22, strokeWidth = 1.8 }: IconProps) => (
  <svg {...base(size)} strokeWidth={strokeWidth}>
    <path d="M4 7.5h7M15 7.5h5M4 16.5h3M11 16.5h9" />
    <circle cx="13" cy="7.5" r="2.2" />
    <circle cx="9" cy="16.5" r="2.2" />
  </svg>
)

export const PlayIcon = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.5 5.8c0-1 1.1-1.6 2-1.1l9.2 6.2c.8.5.8 1.7 0 2.2l-9.2 6.2c-.9.6-2-.05-2-1.1V5.8z" />
  </svg>
)

export const PauseIcon = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="5" width="4" height="14" rx="1.6" />
    <rect x="14" y="5" width="4" height="14" rx="1.6" />
  </svg>
)

export const StopIcon = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2.5" />
  </svg>
)

export const PlusIcon = ({ size = 22, strokeWidth = 2 }: IconProps) => (
  <svg {...base(size)} strokeWidth={strokeWidth}>
    <path d="M12 5.5v13M5.5 12h13" />
  </svg>
)

export const XIcon = ({ size = 22, strokeWidth = 2 }: IconProps) => (
  <svg {...base(size)} strokeWidth={strokeWidth}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </svg>
)

export const TrashIcon = ({ size = 18, strokeWidth = 1.7 }: IconProps) => (
  <svg {...base(size)} strokeWidth={strokeWidth}>
    <path d="M4.5 6.5h15M9.5 6V4.5a1 1 0 011-1h3a1 1 0 011 1V6M7 6.5l.8 12a1.5 1.5 0 001.5 1.4h5.4a1.5 1.5 0 001.5-1.4l.8-12" />
  </svg>
)

export const CheckIcon = ({ size = 18, strokeWidth = 2.2 }: IconProps) => (
  <svg {...base(size)} strokeWidth={strokeWidth}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)
