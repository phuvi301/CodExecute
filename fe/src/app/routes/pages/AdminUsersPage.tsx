import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Users, Search, Edit, ArrowLeft, Loader2, RefreshCw, Shield } from 'lucide-react';
import { UserProfile, adminGetUsersApi } from '../../services/api';
import { AdminUserEditModal } from '../../components/admin/AdminUserEditModal';

export function AdminUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
                          <p className="font-semibold text-sm text-foreground">{u.full_name || 'No Name'}</p>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(u)}
                        className="h-8 px-2.5 gap-1.5 text-xs hover:bg-blue-500/10 hover:text-blue-600 border-border"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </Button>
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
    </div>
  );
}
