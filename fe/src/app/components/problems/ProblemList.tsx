import { useState } from 'react';
import { Search, TrendingUp, CheckCircle2, Circle, Trophy, Award, Flame, Filter, ArrowUpRight, Code2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useNavigate } from 'react-router-dom';

export function ProblemList() {
	const navigate = useNavigate();
	const [searchQuery, setSearchQuery] = useState('');
	const [difficultyFilter, setDifficultyFilter] = useState('all');
	const [topicFilter, setTopicFilter] = useState('all');
	const [statusFilter, setStatusFilter] = useState('all');

	const problems = [
		{ id: '1', title: 'Two Sum', difficulty: 'Easy', acceptance: '48.2%', category: 'Array, Hash Table', status: 'solved' },
		{ id: '2', title: 'Add Two Numbers', difficulty: 'Medium', acceptance: '38.7%', category: 'Linked List, Math', status: 'attempted' },
		{ id: '3', title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', acceptance: '33.5%', category: 'String, Sliding Window', status: 'solved' },
		{ id: '4', title: 'Median of Two Sorted Arrays', difficulty: 'Hard', acceptance: '35.1%', category: 'Array, Binary Search', status: 'todo' },
		{ id: '5', title: 'Longest Palindromic Substring', difficulty: 'Medium', acceptance: '32.3%', category: 'String, Dynamic Programming', status: 'solved' },
		{ id: '6', title: 'Reverse Integer', difficulty: 'Easy', acceptance: '26.8%', category: 'Math', status: 'todo' },
		{ id: '7', title: 'Regular Expression Matching', difficulty: 'Hard', acceptance: '27.9%', category: 'String, Dynamic Programming', status: 'todo' },
		{ id: '8', title: 'Container With Most Water', difficulty: 'Medium', acceptance: '52.7%', category: 'Array, Two Pointers', status: 'attempted' },
		{ id: '9', title: 'Integer to Roman', difficulty: 'Medium', acceptance: '60.1%', category: 'Hash Table, Math', status: 'todo' },
		{ id: '10', title: 'Roman to Integer', difficulty: 'Easy', acceptance: '57.3%', category: 'Hash Table, Math', status: 'solved' },
		{ id: '11', title: 'Valid Parentheses', difficulty: 'Easy', acceptance: '40.6%', category: 'Stack, String', status: 'solved' },
		{ id: '12', title: 'Merge Two Sorted Lists', difficulty: 'Easy', acceptance: '61.2%', category: 'Linked List', status: 'todo' }
	];

	const filteredProblems = problems.filter((problem) => {
		const matchesSearch = problem.title.toLowerCase().includes(searchQuery.toLowerCase()) || problem.category.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesDifficulty = difficultyFilter === 'all' || problem.difficulty.toLowerCase() === difficultyFilter;
		const matchesTopic = topicFilter === 'all' || problem.category.toLowerCase().includes(topicFilter.toLowerCase());
		const matchesStatus = statusFilter === 'all' || problem.status === statusFilter;
		return matchesSearch && matchesDifficulty && matchesTopic && matchesStatus;
	});

	return (
		<div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
			{/* Page Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
						<span>Problem Set</span>
					</h1>
					<p className="text-muted-foreground text-sm mt-1">
						Master algorithms, data structures, and system design through interactive practice.
					</p>
				</div>

				<div className="flex items-center gap-3">
					<Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl font-semibold shadow-md shadow-primary/20" onClick={() => navigate('/problems/1')}>
						<Flame className="w-4 h-4 text-amber-300" />
						<span>Pick Random</span>
					</Button>
				</div>
			</div>

			{/* Stat Overview Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
				{/* Easy Card */}
				<Card className="p-5 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all group">
					<div className="flex items-start justify-between mb-3">
						<div>
							<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Easy Solved</p>
							<h3 className="text-3xl font-extrabold text-foreground mt-1 group-hover:text-emerald-500 transition-colors">45</h3>
						</div>
						<div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
							<CheckCircle2 className="w-5 h-5" />
						</div>
					</div>
					<div className="space-y-1.5">
						<div className="flex justify-between text-xs text-muted-foreground font-mono">
							<span>45 / 100</span>
							<span className="text-emerald-500 font-semibold">45%</span>
						</div>
						<div className="w-full bg-muted rounded-full h-2 overflow-hidden p-0.5 border border-border/40">
							<div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '45%' }}></div>
						</div>
					</div>
				</Card>

				{/* Medium Card */}
				<Card className="p-5 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm hover:shadow-md hover:border-amber-500/40 transition-all group">
					<div className="flex items-start justify-between mb-3">
						<div>
							<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Medium Solved</p>
							<h3 className="text-3xl font-extrabold text-foreground mt-1 group-hover:text-amber-500 transition-colors">32</h3>
						</div>
						<div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
							<Award className="w-5 h-5" />
						</div>
					</div>
					<div className="space-y-1.5">
						<div className="flex justify-between text-xs text-muted-foreground font-mono">
							<span>32 / 150</span>
							<span className="text-amber-500 font-semibold">21%</span>
						</div>
						<div className="w-full bg-muted rounded-full h-2 overflow-hidden p-0.5 border border-border/40">
							<div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: '21%' }}></div>
						</div>
					</div>
				</Card>

				{/* Hard Card */}
				<Card className="p-5 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm hover:shadow-md hover:border-rose-500/40 transition-all group">
					<div className="flex items-start justify-between mb-3">
						<div>
							<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hard Solved</p>
							<h3 className="text-3xl font-extrabold text-foreground mt-1 group-hover:text-rose-500 transition-colors">10</h3>
						</div>
						<div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
							<Trophy className="w-5 h-5" />
						</div>
					</div>
					<div className="space-y-1.5">
						<div className="flex justify-between text-xs text-muted-foreground font-mono">
							<span>10 / 80</span>
							<span className="text-rose-500 font-semibold">12%</span>
						</div>
						<div className="w-full bg-muted rounded-full h-2 overflow-hidden p-0.5 border border-border/40">
							<div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: '12%' }}></div>
						</div>
					</div>
				</Card>

				{/* Total Solved Card */}
				<Card className="p-5 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/40 transition-all group">
					<div className="flex items-start justify-between mb-3">
						<div>
							<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Solved</p>
							<h3 className="text-3xl font-extrabold text-foreground mt-1 group-hover:text-primary transition-colors">87</h3>
						</div>
						<div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
							<TrendingUp className="w-5 h-5" />
						</div>
					</div>
					<div className="space-y-1.5">
						<div className="flex justify-between text-xs text-muted-foreground font-mono">
							<span>87 / 330</span>
							<span className="text-primary font-semibold">26%</span>
						</div>
						<div className="w-full bg-muted rounded-full h-2 overflow-hidden p-0.5 border border-border/40">
							<div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: '26%' }}></div>
						</div>
					</div>
				</Card>
			</div>

			{/* Search & Filter Toolbar */}
			<Card className="p-4 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm">
				<div className="flex flex-col md:flex-row items-center gap-4">
					{/* Search Input */}
					<div className="flex-1 relative w-full">
						<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
						<Input
							type="text"
							placeholder="Search problems, topics, or keywords..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl text-sm focus:ring-1 focus:ring-primary"
						/>
					</div>

					{/* Filters */}
					<div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
						<div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 font-medium mr-1">
							<Filter className="w-3.5 h-3.5" />
							<span>Filters:</span>
						</div>

						<Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
							<SelectTrigger className="w-36 h-9 bg-background border-border rounded-xl text-xs font-medium">
								<SelectValue placeholder="Difficulty" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Difficulty</SelectItem>
								<SelectItem value="easy">Easy</SelectItem>
								<SelectItem value="medium">Medium</SelectItem>
								<SelectItem value="hard">Hard</SelectItem>
							</SelectContent>
						</Select>

						<Select value={topicFilter} onValueChange={setTopicFilter}>
							<SelectTrigger className="w-36 h-9 bg-background border-border rounded-xl text-xs font-medium">
								<SelectValue placeholder="Topic" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Topics</SelectItem>
								<SelectItem value="array">Array</SelectItem>
								<SelectItem value="string">String</SelectItem>
								<SelectItem value="linked list">Linked List</SelectItem>
								<SelectItem value="hash table">Hash Table</SelectItem>
								<SelectItem value="math">Math</SelectItem>
							</SelectContent>
						</Select>

						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="w-36 h-9 bg-background border-border rounded-xl text-xs font-medium">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="todo">Todo</SelectItem>
								<SelectItem value="solved">Solved</SelectItem>
								<SelectItem value="attempted">Attempted</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</Card>

			{/* Problem Table */}
			<Card className="bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl overflow-hidden shadow-sm">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead className="bg-muted/40 border-b border-border/80 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
							<tr>
								<th className="px-6 py-3.5 w-14 text-center">Status</th>
								<th className="px-6 py-3.5">Title</th>
								<th className="px-6 py-3.5">Difficulty</th>
								<th className="px-6 py-3.5">Topics</th>
								<th className="px-6 py-3.5">Acceptance</th>
								<th className="px-6 py-3.5 text-right w-28">Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border/50 text-sm">
							{filteredProblems.length > 0 ? (
								filteredProblems.map((problem) => (
									<tr
										key={problem.id}
										className="hover:bg-accent/40 transition-colors cursor-pointer group"
										onClick={() => navigate(`/problems/${problem.id}`)}
									>
										{/* Status icon */}
										<td className="px-6 py-4 text-center">
											{problem.status === 'solved' ? (
												<CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
											) : problem.status === 'attempted' ? (
												<Circle className="w-5 h-5 text-amber-500 mx-auto" />
											) : (
												<Circle className="w-5 h-5 text-muted-foreground/40 mx-auto" />
											)}
										</td>

										{/* Title */}
										<td className="px-6 py-4 font-semibold text-foreground group-hover:text-primary transition-colors">
											<div className="flex items-center gap-2">
												<span>{problem.id}. {problem.title}</span>
											</div>
										</td>

										{/* Difficulty Badge */}
										<td className="px-6 py-4">
											<Badge
												variant="outline"
												className={`text-xs px-2.5 py-0.5 font-medium border rounded-full ${
													problem.difficulty === 'Easy'
														? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
														: problem.difficulty === 'Medium'
														? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
														: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
												}`}
											>
												{problem.difficulty}
											</Badge>
										</td>

										{/* Category/Tags */}
										<td className="px-6 py-4">
											<div className="flex flex-wrap gap-1.5">
												{problem.category.split(', ').map((tag) => (
													<span key={tag} className="bg-muted/70 text-muted-foreground text-[11px] px-2.5 py-0.5 rounded-lg border border-border/40 font-mono">
														{tag}
													</span>
												))}
											</div>
										</td>

										{/* Acceptance Rate */}
										<td className="px-6 py-4 text-muted-foreground font-mono text-xs">
											{problem.acceptance}
										</td>

										{/* Action */}
										<td className="px-6 py-4 text-right">
											<Button
												size="sm"
												className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl h-8 px-4 text-xs gap-1 shadow-sm shadow-primary/20 transition-transform group-hover:scale-105"
												onClick={(e) => {
													e.stopPropagation();
													navigate(`/problems/${problem.id}`);
												}}
											>
												<span>Solve</span>
												<ArrowUpRight className="w-3.5 h-3.5" />
											</Button>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-mono text-xs">
										No problems found matching your filters.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</Card>

			{/* Daily Challenge Card */}
			<Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-r from-primary via-primary/90 to-blue-600 text-primary-foreground shadow-xl relative">
				<div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 backdrop-blur-3xl rounded-l-full pointer-events-none" />
				<div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
					<div className="flex items-start md:items-center gap-4">
						<div className="w-14 h-14 bg-primary-foreground/20 rounded-2xl flex items-center justify-center shrink-0 border border-primary-foreground/30 shadow-inner">
							<Flame className="w-8 h-8 text-amber-300 animate-pulse" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h3 className="text-xl font-bold">Daily Coding Challenge</h3>
								<Badge className="bg-amber-400 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full">
									+50 XP
								</Badge>
							</div>
							<p className="text-primary-foreground/80 text-xs md:text-sm mt-1">
								Solve today&apos;s featured problem &quot;Two Sum&quot; to maintain your streak and earn bonus developer points.
							</p>
						</div>
					</div>

					<Button
						className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-bold rounded-xl px-6 h-11 text-sm shadow-lg shrink-0 gap-2 transition-transform hover:scale-105"
						onClick={() => navigate('/problems/1')}
					>
						<Code2 className="w-4 h-4" />
						<span>Start Challenge</span>
					</Button>
				</div>
			</Card>
		</div>
	);
}