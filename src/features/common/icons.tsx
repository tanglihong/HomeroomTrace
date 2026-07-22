import type { ComponentType, ReactNode, SVGProps } from "react";
import type { WorkRecordType } from "@/domain/models/work-record-type";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 24, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconHouse({ size, filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Icon size={size} {...props}>
      {filled ? (
        <path d="M12 3.5 4 10v10h5v-6h6v6h5V10L12 3.5Z" fill="currentColor" stroke="none" />
      ) : (
        <>
          <path d="M4 10.5 12 4l8 6.5" />
          <path d="M6 10v10h4v-6h4v6h4V10" />
        </>
      )}
    </Icon>
  );
}

export function IconPeople({ size, filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Icon size={size} {...props}>
      {filled ? (
        <>
          <circle cx="9" cy="8" r="3" fill="currentColor" stroke="none" />
          <path d="M3.5 19c.6-3 3-5 5.5-5s4.9 2 5.5 5" fill="currentColor" stroke="none" />
          <circle cx="16.5" cy="9" r="2.5" fill="currentColor" stroke="none" />
          <path d="M13.5 19c.4-2.2 2-3.8 4-3.8" fill="currentColor" stroke="none" />
        </>
      ) : (
        <>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19c.6-3 3-5 5.5-5s4.9 2 5.5 5" />
          <circle cx="16.5" cy="9" r="2.5" />
          <path d="M13.5 19c.4-2.2 2-3.8 4-3.8" />
        </>
      )}
    </Icon>
  );
}

export function IconChart({ size, filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Icon size={size} {...props}>
      {filled ? (
        <>
          <rect x="5" y="12" width="3" height="8" rx="1" fill="currentColor" stroke="none" />
          <rect x="10.5" y="8" width="3" height="12" rx="1" fill="currentColor" stroke="none" />
          <rect x="16" y="5" width="3" height="15" rx="1" fill="currentColor" stroke="none" />
        </>
      ) : (
        <>
          <path d="M6.5 20V12" />
          <path d="M12 20V8" />
          <path d="M17.5 20V5" />
        </>
      )}
    </Icon>
  );
}

export function IconGear({ size, filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Icon size={size} {...props}>
      {filled ? (
        <path
          d="M12 8.2a3.8 3.8 0 1 1 0 7.6 3.8 3.8 0 0 1 0-7.6Zm8.2 3.8-1.4-.2-.5-1.3 1-1-1.4-2.4-1.2.7-1.2-.8-.2-1.4-2.8-.4-.4 2.8-.2 1.2-.8 1.2.7 1.4-2.4 1-1-.5-1.3-1.4-.2-.4-2.8h-2.8l-.4 2.8-1.4.2-.5 1.3 1 1-1.4 2.4 1.2.7-.8 1.2-.2 1.4-2.8.4-.4-2.8.2-1.2-.8-1.2-.7-1.4 2.4-1 1 .5 1.3 1.4.2.4 2.8h2.8l.4-2.8Z"
          fill="currentColor"
          stroke="none"
        />
      ) : (
        <>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" />
        </>
      )}
    </Icon>
  );
}

export function IconChevronRight({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="m9 6 6 6-6 6" />
    </Icon>
  );
}

export function IconDoc({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M8 4h6l4 4v12H8V4Z" />
      <path d="M14 4v4h4" />
      <path d="M10 13h6M10 16h6" />
    </Icon>
  );
}

export function IconPlus({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function IconPhone({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M8.5 5.5 6 8c1.2 3.2 4.8 6.8 8 8l2.5-2.5c.4-.4 1-.5 1.5-.3l3 1.2c.6.2 1 .8 1 1.4v2.7c0 .8-.7 1.5-1.5 1.5C10.2 20.5 3.5 13.8 3.5 5.5 3.5 4.7 4.2 4 5 4h2.7c.6 0 1.2.4 1.4 1l1.2 3c.2.5.1 1.1-.3 1.5Z" />
    </Icon>
  );
}

export function IconBubble({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M6 6.5h12v9H10l-4 3.5V6.5Z" />
    </Icon>
  );
}

export function IconUsers({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <circle cx="9" cy="9" r="2.5" />
      <path d="M4.5 18c.5-2.5 2.5-4 4.5-4s4 1.5 4.5 4" />
      <circle cx="16" cy="10" r="2" />
      <path d="M13 18c.3-1.8 1.6-3 3-3s2.7 1.2 3 3" />
    </Icon>
  );
}

export function IconShield({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M12 4 6 6.5V12c0 3.5 2.6 6.2 6 7.5 3.4-1.3 6-4 6-7.5V6.5L12 4Z" />
    </Icon>
  );
}

export function IconWarning({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M12 4 4 19h16L12 4Z" />
      <path d="M12 10v4M12 16h.01" />
    </Icon>
  );
}

export function IconDoor({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M8 5h8v14H8V5Z" />
      <circle cx="14.5" cy="12" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function IconBook({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M6 5.5h12v13H6V5.5Z" />
      <path d="M9 5.5V18.5M15 5.5V18.5" />
    </Icon>
  );
}

export function IconEye({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </Icon>
  );
}

export function IconStar({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="m12 5 1.8 3.7 4.1.6-3 2.9.7 4.1L12 14.8 8.4 16.3l.7-4.1-3-2.9 4.1-.6L12 5Z" />
    </Icon>
  );
}

export function IconCamera({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M5 8h3l1.5-2h5L16 8h3v10H5V8Z" />
      <circle cx="12" cy="13" r="3" />
    </Icon>
  );
}

export function IconMic({ size, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <rect x="9" y="4" width="6" height="10" rx="3" />
      <path d="M6 12a6 6 0 0 0 12 0M12 18v2" />
    </Icon>
  );
}

const RECORD_TYPE_META: Record<
  WorkRecordType,
  { Icon: ComponentType<IconProps>; color: string; bg: string }
> = {
  homeVisit: { Icon: IconPhone, color: "#007AFF", bg: "rgba(0,122,255,0.12)" },
  talk: { Icon: IconBubble, color: "#5856D6", bg: "rgba(88,86,214,0.12)" },
  classMeeting: { Icon: IconUsers, color: "#FF9500", bg: "rgba(255,149,0,0.12)" },
  parentMeeting: { Icon: IconPeople, color: "#34C759", bg: "rgba(52,199,89,0.12)" },
  safetyEducation: { Icon: IconShield, color: "#FF3B30", bg: "rgba(255,59,48,0.12)" },
  discipline: { Icon: IconWarning, color: "#FF9500", bg: "rgba(255,149,0,0.12)" },
  classroomVisit: { Icon: IconDoor, color: "#5AC8FA", bg: "rgba(90,200,250,0.12)" },
  classDiary: { Icon: IconBook, color: "#AF52DE", bg: "rgba(175,82,222,0.12)" },
  lessonObservation: { Icon: IconEye, color: "#32ADE6", bg: "rgba(50,173,230,0.12)" },
  behaviorNote: { Icon: IconStar, color: "#FFCC00", bg: "rgba(255,204,0,0.16)" },
};

export function RecordTypeIcon({ type, size = 22 }: { type: WorkRecordType; size?: number }) {
  const { Icon: TypeIcon, color, bg } = RECORD_TYPE_META[type];
  return (
    <span className="record-type-icon" style={{ background: bg, color }}>
      <TypeIcon size={size} />
    </span>
  );
}

export const TabIcons = {
  workbench: IconHouse,
  students: IconPeople,
  grades: IconChart,
  mine: IconGear,
};
