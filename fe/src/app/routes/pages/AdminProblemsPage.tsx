import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Plus, Search, Edit, Trash2, Code2, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { adminDeleteProblemApi, getProblemsApi } from '../../services/api';

export function AdminProblemsPage() {
  const navigate = useNavigate();
  const [problems, setProblems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchProblems = async () => {
    setIsLoading(true);
    try {
      const data = await getProblemsApi();
      if (Array.isArray(data)) {
        setProblems(data);
      }
    } catch (err) {
      console.error('Failed to fetch problems:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const handleDelete = async (problemId: string) => {
    if (!window.confirm(`Are you sure you want to delete problem ID "${problemId}"?`)) {
      return;
    }

    try {
      setDeleteId(problemId);
      await adminDeleteProblemApi(problemId);
      setProblems(problems.filter((p) => (p.ProblemID || p.problem_id || p.id) !== problemId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete problem.');
    } finally {
      setDeleteId(null);
    }
  };

  const filteredProblems = problems.filter((p) => {
    const title = (p.Title || p.title || '').toLowerCase();
    const category = (p.Category || p.category || '').toLowerCase();
    const id = (p.ProblemID || p.problem_id || p.id || '').toLowerCase();
    const query = searchQuery.toLowerCase().trim();

    const matchesSearch = title.includes(query) || category.includes(query) || id.includes(query);
    const difficulty = p.Difficulty || p.difficulty;
    const matchesDifficulty = difficultyFilter === 'ALL' || difficulty === difficultyFilter;

    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Navigation & Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin')} className="h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Code2 className="w-6 h-6 text-primary" />
              Problem Management
            </h1>
            <p className="text-xs text-muted-foreground">Create, edit title, description, complexity, limits, and testcases.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchProblems} disabled={isLoading} className="gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => navigate('/admin/problems/new')} className="gap-2 font-semibold shadow-sm">
            <Plus className="w-4 h-4" />
            New Problem
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-card border-border p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by Title, Category, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {['ALL', 'Easy', 'Medium', 'Hard'].map((diff) => (
              <Button
                key={diff}
                variant={difficultyFilter === diff ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDifficultyFilter(diff)}
                className="text-xs h-8 px-3"
              >
                {diff === 'ALL' ? 'All Difficulties' : diff}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Problems Table */}
      <Card className="bg-card border-border overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Loading problems catalog...</p>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="text-center p-12 space-y-3">
            <p className="text-muted-foreground font-medium">No problems found matching your criteria.</p>
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setDifficultyFilter('ALL'); }}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="w-[120px]">Problem ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Limits (Time / Memory)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProblems.map((prob) => {
                const probId = prob.ProblemID || prob.problem_id || prob.id;
                const title = prob.Title || prob.title;
                const category = prob.Category || prob.category || 'General';
                const difficulty = prob.Difficulty || prob.difficulty || 'Easy';
                const timeLimit = prob.TimeLimit || prob.time_limit || 2.0;
                const memoryLimit = prob.MemoryLimit || prob.memory_limit || 256;

                return (
                  <TableRow key={probId} className="border-border hover:bg-accent/40">
                    <TableCell className="font-mono text-xs font-semibold text-primary">{probId}</TableCell>
                    <TableCell className="font-semibold text-foreground">{title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[11px] font-normal">
                        {category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs px-2 py-0.5 font-medium border ${difficulty === 'Easy'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : difficulty === 'Medium'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          }`}
                      >
                        {difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {timeLimit}s / {memoryLimit}MB
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/problems/${probId}/edit`)}
                        className="h-8 px-2.5 gap-1.5 text-xs"
                      >
                        <Edit className="w-3.5 h-3.5 text-blue-500" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(probId)}
                        disabled={deleteId === probId}
                        className="h-8 px-2.5 gap-1.5 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                      >
                        {deleteId === probId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
