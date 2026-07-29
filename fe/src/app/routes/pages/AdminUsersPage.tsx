import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Users, Search, Edit, Trash2, ArrowLeft, Loader2, RefreshCw, Shield, AlertTriangle } from 'lucide-react';
import { UserProfile, adminGetUsersApi, adminDeleteUserApi } from '../../services/api';
import { AdminUserEditModal } from '../../components/admin/AdminUserEditModal';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '../../components/ui/alert-dialog';
import { useAuth } from '../../context/AuthContext';

export function AdminUsersPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Delete User state
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminGetUsersApi();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await adminDeleteUserApi(userToDelete.user_id);
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      setDeleteError(err.message || 'An error occurred while deleting user');
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const filteredUsers = users.filter((u) => {
    const fullName = (u.full_name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const query = searchQuery.toLowerCase().trim();

    const matchesSearch = fullName.includes(query) || email.includes(query);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin')} className="h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              User & Role Management
            </h1>
            <p className="text-xs text-muted-foreground">List of all system accounts, update user profiles, and manage role permissions.</p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoading} className="gap-1.5 text-xs self-start sm:self-auto">
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-card border-border p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by Name or Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {['ALL', 'user', 'admin'].map((r) => (
              <Button
                key={r}
                variant={roleFilter === r ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter(r)}
                className="text-xs h-8 px-3 capitalize"
              >
                {r === 'ALL' ? 'All Roles' : r}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="bg-card border-border overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Loading user accounts...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center p-12 space-y-3">
            <p className="text-muted-foreground font-medium">No users found matching your search query.</p>
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setRoleFilter('ALL'); }}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Title / Address</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => {
                const isAdmin = u.role === 'admin';
                const isSelf = u.user_id === currentUser?.user_id;

                return (
                  <TableRow key={u.user_id} className="border-border hover:bg-accent/40">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-border">
                          <AvatarImage src={u.avatar_url} alt={u.full_name} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                            {getInitials(u.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                            {u.full_name || 'No Name'}
                            {isSelf && (
                              <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-normal px-1.5 py-0.2 rounded border border-blue-500/20">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono">ID: {u.user_id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-xs text-foreground">{u.email}</TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <Badge variant="default" className="bg-blue-600 text-white font-semibold text-[11px] px-2.5 py-0.5 gap-1">
                          <Shield className="w-3 h-3 fill-current" />
                          ADMIN
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-500/10 text-slate-600 dark:text-slate-300 font-medium text-[11px] px-2.5 py-0.5">
                          USER
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div>{u.title || '-'}</div>
                      <div className="text-[11px] text-muted-foreground/70">{u.address || ''}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('en-US') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(u)}
                          className="h-8 px-2.5 gap-1.5 text-xs hover:bg-blue-500/10 hover:text-blue-600 border-border"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isSelf}
                          onClick={() => {
                            setUserToDelete(u);
                            setDeleteError('');
                          }}
                          className="h-8 px-2.5 gap-1.5 text-xs text-red-600 hover:bg-red-500/10 hover:text-red-700 border-red-200 dark:border-red-900/40 disabled:opacity-40 disabled:cursor-not-allowed"
                          title={isSelf ? 'Cannot delete your own account' : 'Delete user account'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Edit User Modal */}
      <AdminUserEditModal
        user={selectedUser}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchUsers}
      />

      {/* Delete User Confirmation Modal */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && !isDeleting && setUserToDelete(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Confirm Delete User
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2 text-sm text-muted-foreground">
                <p>
                  Are you sure you want to permanently delete user <strong className="text-foreground">{userToDelete?.full_name || userToDelete?.email}</strong>?
                </p>
                {userToDelete && (
                  <div className="p-3 rounded-lg bg-accent/50 border border-border text-xs space-y-1">
                    <div><span className="font-semibold text-foreground">Email:</span> {userToDelete.email}</div>
                    <div><span className="font-semibold text-foreground">Role:</span> <span className="capitalize font-medium">{userToDelete.role}</span></div>
                    <div><span className="font-semibold text-foreground">ID:</span> <code className="font-mono text-[11px]">{userToDelete.user_id}</code></div>
                  </div>
                )}
                <p className="text-xs text-red-500 font-medium">
                  ⚠️ This action cannot be undone. All data belonging to this account will be permanently removed.
                </p>
                {deleteError && (
                  <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-medium">
                    {deleteError}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isDeleting} onClick={() => setUserToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDeleteUser}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
