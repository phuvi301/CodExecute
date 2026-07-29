import { useState, useEffect, FormEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { UserProfile, adminUpdateUserApi } from '../../services/api';
import { Loader2, Shield, User, Key } from 'lucide-react';

interface AdminUserEditModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminUserEditModal({ user, isOpen, onClose, onSuccess }: AdminUserEditModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setRole((user.role as 'user' | 'admin') || 'user');
      setTitle(user.title || '');
      setAddress(user.address || '');
      setBio(user.bio || '');
      setNewPassword('');
      setErrorMessage('');
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      await adminUpdateUserApi(user.user_id, {
        full_name: fullName.trim(),
        email: email.trim(),
        role: role,
        title: title.trim(),
        address: address.trim(),
        bio: bio.trim(),
        ...(newPassword.trim() ? { new_password: newPassword.trim() } : {}),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update user profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] bg-card border-border text-card-foreground p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Edit User & Permissions
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Administrators can modify user profiles, reset passwords, and assign role privileges.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Full Name</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-primary" />
                Role / Permissions
              </Label>
              <Select value={role} onValueChange={(val: 'user' | 'admin') => setRole(val)}>
                <SelectTrigger className="w-full bg-background border-border">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <span className="font-medium text-foreground">User</span> - Standard User
                  </SelectItem>
                  <SelectItem value="admin">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">Admin</span> - System Administrator
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Job Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Software Engineer"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Address / Location</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. San Francisco, CA"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Biography (Bio)</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short bio about the user"
              rows={2}
            />
          </div>

          <div className="pt-2 border-t border-border space-y-1.5">
            <Label className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" />
              Reset Password (Leave blank to keep current)
            </Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (>= 8 chars, 1 upper, 1 number, 1 special)"
            />
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isLoading} className="gap-2">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
