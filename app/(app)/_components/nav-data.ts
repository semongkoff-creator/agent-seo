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
  label: string;
  icon: LucideIcon;
};

export const primaryNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/diagnosis', label: 'Diagnoses', icon: Activity },
  { href: '/campaign', label: 'Campaigns', icon: Megaphone },
  { href: '/objective', label: 'Objectives', icon: Target },
  { href: '/settings', label: 'Settings', icon: Settings }
];
