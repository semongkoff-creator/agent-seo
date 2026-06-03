import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  FolderKanban,
  LayoutDashboard,
  Megaphone,
  Settings,
  Target
} from 'lucide-react';

export type NavItem = {
  href: string;
  labelKey: 'dashboard' | 'projects' | 'diagnoses' | 'campaigns' | 'objectives' | 'settings';
  icon: LucideIcon;
};

export const primaryNavItems: NavItem[] = [
  { href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { href: '/projects', labelKey: 'projects', icon: FolderKanban },
  { href: '/diagnosis', labelKey: 'diagnoses', icon: Activity },
  { href: '/campaign', labelKey: 'campaigns', icon: Megaphone },
  { href: '/objective', labelKey: 'objectives', icon: Target },
  { href: '/settings', labelKey: 'settings', icon: Settings }
];
