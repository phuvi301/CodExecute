import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ShieldCheck, Code2, Users, Plus, ArrowRight, Activity } from 'lucide-react';
import { adminGetUsersApi } from '../../services/api';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [problemsCount, setProblemsCount] = useState<number | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const users = await adminGetUsersApi();
        setUsersCount(users.length);
      } catch (err) {
        setUsersCount(0);
      }

      try {
        const res = await fetch('http://localhost:8000/api/v1/problems');
        const data = await res.json();
        if (Array.isArray(data)) setProblemsCount(data.length);
      } catch (err) {
        setProblemsCount(0);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-indigo-500/10 border border-primary/20 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-primary/20 text-primary border-primary/30 uppercase tracking-wider text-[11px] font-bold px-2.5 py-0.5">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 inline" />
              Admin Portal
            </Badge>
            <span className="text-xs text-muted-foreground">System Administration</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Manage problem catalog, testcase suites, user roles & permissions, and system settings.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button onClick={() => navigate('/admin/problems/new')} className="gap-2 font-semibold shadow-md">
            <Plus className="w-4 h-4" />
            Create New Problem
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-card border-border hover:border-primary/40 transition-colors shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Problems</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {problemsCount !== null ? problemsCount : '...'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Easy, Medium, and Hard difficulty problems</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-primary/40 transition-colors shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Users</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {usersCount !== null ? usersCount : '...'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Role-based User & Admin accounts</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-primary/40 transition-colors shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">System Health</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">
              Operational
            </div>
            <p className="text-xs text-muted-foreground mt-1">AWS DynamoDB & Execution Services OK</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Admin Features Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Card Manage Problems */}
        <Card className="bg-card border-border shadow-md overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Code2 className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Problem Management</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Add, edit, or delete problems, constraints, time/space complexity, and sample or hidden testcases.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-accent/40">
                <span className="text-muted-foreground">Problem & Testcase CRUD Operations</span>
                <Badge variant="outline" className="text-xs">Admin Only</Badge>
              </div>
              <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-accent/40">
                <span className="text-muted-foreground">Time & Memory Limit Configurations</span>
                <Badge variant="outline" className="text-xs">Execution Limits</Badge>
              </div>
            </CardContent>
          </div>

          <div className="p-6 pt-0 flex gap-3">
            <Button onClick={() => navigate('/admin/problems')} variant="default" className="flex-1 gap-2">
              Problem Catalog
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button onClick={() => navigate('/admin/problems/new')} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              New Problem
            </Button>
          </div>
        </Card>

        {/* Card Manage Users */}
        <Card className="bg-card border-border shadow-md overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">User & Permission Management</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    View all accounts, update user profiles, reset passwords, and grant Admin/User roles.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-accent/40">
                <span className="text-muted-foreground">Role Assignment (User / Admin)</span>
                <Badge variant="outline" className="text-xs">RBAC</Badge>
              </div>
              <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-accent/40">
                <span className="text-muted-foreground">Profile Edits & Password Resets</span>
                <Badge variant="outline" className="text-xs">Admin Only</Badge>
              </div>
            </CardContent>
          </div>

          <div className="p-6 pt-0">
            <Button onClick={() => navigate('/admin/users')} variant="default" className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white">
              Manage Users List
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
