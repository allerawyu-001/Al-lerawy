import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../hooks/use-auth';
import { toast } from 'sonner';
import { LogOut, User, Settings, Bell, ChevronDown } from 'lucide-react';
import { auth } from '@/integrations/firebase/client';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

/**
 * Centralized account dropdown used across all dashboard layouts.
 * Generates role-agnostic navigation links for profile, settings, and notifications.
 * Includes a logout option.
 */
const AccountDropdown: React.FC = () => {
  const { profile, user, role, roles } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Normalize role
  const normalizedRole = (role || roles?.[0] || 'customer').toLowerCase();
  const basePath = `/${normalizedRole}`;

  const fullName = profile?.firstName ? `${profile.firstName} ${profile.secondName || ''}`.trim() : null;
  const name = fullName || user?.email || "Guest";
  const initials = name.slice(0, 1).toUpperCase();

  const handleNavigate = (path: string) => {
    setOpen(false);
    navigate({ to: path as any });
  };

  const handleLogout = async () => {
    setOpen(false);
    await auth.signOut();
    toast.success('Signed out');
    navigate({ to: '/' });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="flex items-center gap-3 rounded-full border border-border bg-secondary/40 px-2 py-1.5 transition hover:border-gold/40 focus:outline-none">
        {profile?.profilePicture ? (
          <img src={profile.profilePicture} alt={`${name}'s avatar`} className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gold text-xs font-bold text-primary-foreground">{initials}</span>
        )}
        <span className="text-sm font-medium max-w-[150px] truncate">{name}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium truncate">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onSelect={() => handleNavigate(`${basePath}/profile`)} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" /> My Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleNavigate(`${basePath}/settings`)} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleNavigate(`${basePath}/notifications`)} className="cursor-pointer">
          <Bell className="mr-2 h-4 w-4" /> Notifications
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountDropdown;
