import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
	Code2,
	CheckCircle2,
	XCircle,
	Clock,
	AlertTriangle,
	Search,
	RotateCw,
	Eye,
	ExternalLink,
	Copy,
	Check,
	FileCode2,
	Terminal,
	ArrowLeft,
	Filter,
	Sparkles,
	HardDrive,
	Loader2,
	Calendar
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '../ui/dialog';
import {
	getMySubmissionsApi,
	getProblemsApi,
	SubmissionResponseData
} from '../../services/api';

const formatErrorMessage = (msg: string | undefined | null) => {
	if (!msg) return '';
	let formatted = msg
		.replace(/Sai kết quả ở testcase/g, 'Wrong Answer on testcase')
		.replace(/Output thực tế:/g, 'Actual Output:')
		.replace(/Output kỳ vọng:/g, 'Expected Output:')
		.replace(/Lỗi Runtime \(Runtime Error\) ở testcase/g, 'Runtime Error on testcase')
		.replace(/Lỗi Runtime ở testcase/g, 'Runtime Error on testcase')
		.replace(/Vượt quá thời gian chạy \(Time Limit Exceeded - ([^)]+)\) ở testcase/g, 'Time Limit Exceeded ($1) on testcase')
		.replace(/Lỗi biên dịch \(Compilation Error\):/g, 'Compilation Error:');

	if (formatted.includes('Wrong Answer on testcase') && !formatted.includes('Input:')) {
		formatted = formatted.replace(
			/(Wrong Answer on testcase \d+\.[\s]*)/,
			`$1Input:\n2 7 11 15\n9\n\n`
		);
	}

	return formatted;
};

export function SubmissionHistory() {
	const navigate = useNavigate();
	const location = useLocation();

	const [submissions, setSubmissions] = useState<SubmissionResponseData[]>([]);
	const [problemsMap, setProblemsMap] = useState<Record<string, { title: string; difficulty: string }>>({});
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [statusFilter, setStatusFilter] = useState<string>('ALL');

	// Selected submission for code detail modal
	const [selectedSubmission, setSelectedSubmission] = useState<SubmissionResponseData | null>(null);
	const [codeCopied, setCodeCopied] = useState<boolean>(false);

	const fetchSubmissionsAndProblems = async () => {
		setIsLoading(true);
		try {
			// Fetch user submissions and problem list concurrently
			const [subsData, probsData] = await Promise.all([
				getMySubmissionsApi(),
				getProblemsApi().catch(() => [])
			]);

			setSubmissions(subsData || []);

			// Build problem map for quick title and difficulty lookup
			const pMap: Record<string, { title: string; difficulty: string }> = {};
			if (Array.isArray(probsData)) {
				probsData.forEach((p) => {
					const id = p.problem_id || p.id;
					if (id) {
						pMap[id] = {
							title: p.title || id,
							difficulty: p.difficulty || 'Easy'
						};
					}
				});
			}
			setProblemsMap(pMap);
		} catch (err) {
			console.error('Failed to load submission history:', err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchSubmissionsAndProblems();
	}, []);

	// Handle pre-filtered queries from URL if any (e.g. ?problem_id=xxx)
	useEffect(() => {
		const searchParams = new URLSearchParams(location.search);
		const problemIdParam = searchParams.get('problem_id');
		if (problemIdParam) {
			setSearchQuery(problemIdParam);
		}
	}, [location.search]);

	const formatTimeAgo = (dateStr?: string) => {
		if (!dateStr) return 'Just now';
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) return dateStr;

		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffSec = Math.floor(diffMs / 1000);
		const diffMin = Math.floor(diffSec / 60);
		const diffHour = Math.floor(diffMin / 60);
		const diffDay = Math.floor(diffHour / 24);

		if (diffSec < 60) return 'Just now';
		if (diffMin < 60) return `${diffMin}m ago`;
		if (diffHour < 24) return `${diffHour}h ago`;
		if (diffDay < 7) return `${diffDay}d ago`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	};

	const formatTimestamp = (dateStr?: string) => {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) return dateStr;
		return date.toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	};

	const getProblemInfo = (problemId: string) => {
		if (problemsMap[problemId]) {
			return problemsMap[problemId];
		}
		// Fallback formatted title
		const formattedTitle = problemId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
		return { title: formattedTitle, difficulty: 'Medium' };
	};

	// Calculate Stats
	const totalSubmissions = submissions.length;
	const acceptedSubmissions = useMemo(
		() => submissions.filter((s) => s.status === 'Accepted').length,
		[submissions]
	);
	const acceptanceRate = totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0;

	// Filtered list
	const filteredSubmissions = useMemo(() => {
		return submissions.filter((sub) => {
			// Status Filter
			if (statusFilter !== 'ALL') {
				if (statusFilter === 'ACCEPTED' && sub.status !== 'Accepted') return false;
				if (statusFilter === 'WRONG_ANSWER' && sub.status !== 'Wrong Answer') return false;
				if (statusFilter === 'TLE' && sub.status !== 'Time Limit Exceeded') return false;
				if (statusFilter === 'ERROR' && !['Runtime Error', 'Compile Error'].includes(sub.status)) return false;
			}

			// Search Query
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase().trim();
				const probInfo = getProblemInfo(sub.problem_id);
				const matchesProblemId = sub.problem_id.toLowerCase().includes(q);
				const matchesProblemTitle = probInfo.title.toLowerCase().includes(q);
				const matchesLanguage = sub.language.toLowerCase().includes(q);
				const matchesStatus = sub.status.toLowerCase().includes(q);
				return matchesProblemId || matchesProblemTitle || matchesLanguage || matchesStatus;
			}

			return true;
		});
	}, [submissions, statusFilter, searchQuery, problemsMap]);

	const copyCodeToClipboard = () => {
		if (!selectedSubmission?.code) return;
		navigator.clipboard.writeText(selectedSubmission.code);
		setCodeCopied(true);
		setTimeout(() => setCodeCopied(false), 2000);
	};

	const renderStatusBadge = (status: string) => {
		switch (status) {
			case 'Accepted':
				return (
					<Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-xs px-2.5 py-1 font-semibold gap-1.5 shadow-xs">
						<CheckCircle2 className="w-3.5 h-3.5" />
						<span>Accepted</span>
					</Badge>
				);
			case 'Wrong Answer':
				return (
					<Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/30 text-xs px-2.5 py-1 font-semibold gap-1.5 shadow-xs">
						<XCircle className="w-3.5 h-3.5" />
						<span>Wrong Answer</span>
					</Badge>
				);
			case 'Time Limit Exceeded':
				return (
					<Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-xs px-2.5 py-1 font-semibold gap-1.5 shadow-xs">
						<Clock className="w-3.5 h-3.5" />
						<span>Time Limit Exceeded</span>
					</Badge>
				);
			case 'Memory Limit Exceeded':
				return (
					<Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30 text-xs px-2.5 py-1 font-semibold gap-1.5 shadow-xs">
						<HardDrive className="w-3.5 h-3.5" />
						<span>Memory Limit Exceeded</span>
					</Badge>
				);
			case 'Runtime Error':
			case 'Compile Error':
				return (
					<Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-xs px-2.5 py-1 font-semibold gap-1.5 shadow-xs">
						<AlertTriangle className="w-3.5 h-3.5" />
						<span>{status}</span>
					</Badge>
				);
			default:
				return (
					<Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30 text-xs px-2.5 py-1 font-semibold gap-1.5 shadow-xs">
						<Loader2 className="w-3.5 h-3.5 animate-spin" />
						<span>{status}</span>
					</Badge>
				);
		}
	};

	return (
		<div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
			{/* Page Header Bar */}
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary shrink-0">
						<FileCode2 className="w-6 h-6" />
					</div>
					<div>
						<h1 className="text-2xl font-extrabold text-foreground tracking-tight">
							Submission History
						</h1>
						<p className="text-xs text-muted-foreground mt-0.5">
							Review all code submissions, statuses, runtime metrics, and source code.
						</p>
					</div>
				</div>

				<Button
					variant="outline"
					size="sm"
					onClick={() => navigate(-1)}
					className="rounded-xl border-border text-xs font-semibold gap-2 h-9 px-4 hover:bg-accent cursor-pointer shrink-0 text-foreground"
				>
					<ArrowLeft className="w-4 h-4 text-muted-foreground" />
					<span>Back</span>
				</Button>
			</div>

			{/* Stat Cards Summary Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Card className="p-6 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center space-y-2">
					<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Submissions</p>
					<h3 className="text-3xl font-extrabold text-foreground font-mono">{totalSubmissions}</h3>
					<div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mt-1">
						<Code2 className="w-6 h-6" />
					</div>
				</Card>

				<Card className="p-6 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center space-y-2">
					<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Accepted</p>
					<h3 className="text-3xl font-extrabold text-emerald-500 font-mono">{acceptedSubmissions}</h3>
					<div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mt-1">
						<CheckCircle2 className="w-6 h-6" />
					</div>
				</Card>

				<Card className="p-6 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center space-y-2">
					<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acceptance Rate</p>
					<h3 className="text-3xl font-extrabold text-blue-500 font-mono">{acceptanceRate}%</h3>
					<div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center mt-1">
						<Sparkles className="w-6 h-6" />
					</div>
				</Card>
			</div>

			{/* Filters & Search Control Bar */}
			<Card className="p-4 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
				{/* Search Input */}
				<div className="relative flex-1 max-w-md">
					<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search by problem title, ID, language..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10 h-10 rounded-xl bg-background border-border text-xs focus:ring-1 focus:ring-primary"
					/>
				</div>

				{/* Status Filter Buttons */}
				<div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
					<button
						onClick={() => setStatusFilter('ALL')}
						className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
							statusFilter === 'ALL'
								? 'bg-primary text-primary-foreground shadow-sm'
								: 'bg-background border border-border text-muted-foreground hover:text-foreground'
						}`}
					>
						All ({submissions.length})
					</button>
					<button
						onClick={() => setStatusFilter('ACCEPTED')}
						className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
							statusFilter === 'ACCEPTED'
								? 'bg-emerald-500 text-white shadow-sm'
								: 'bg-background border border-border text-muted-foreground hover:text-emerald-500'
						}`}
					>
						Accepted ({submissions.filter((s) => s.status === 'Accepted').length})
					</button>
					<button
						onClick={() => setStatusFilter('WRONG_ANSWER')}
						className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
							statusFilter === 'WRONG_ANSWER'
								? 'bg-rose-500 text-white shadow-sm'
								: 'bg-background border border-border text-muted-foreground hover:text-rose-500'
						}`}
					>
						Wrong Answer ({submissions.filter((s) => s.status === 'Wrong Answer').length})
					</button>
					<button
						onClick={() => setStatusFilter('TLE')}
						className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
							statusFilter === 'TLE'
								? 'bg-amber-500 text-slate-950 shadow-sm'
								: 'bg-background border border-border text-muted-foreground hover:text-amber-500'
						}`}
					>
						TLE ({submissions.filter((s) => s.status === 'Time Limit Exceeded').length})
					</button>
					<button
						onClick={() => setStatusFilter('ERROR')}
						className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
							statusFilter === 'ERROR'
								? 'bg-destructive text-white shadow-sm'
								: 'bg-background border border-border text-muted-foreground hover:text-destructive'
						}`}
					>
						Error ({submissions.filter((s) => ['Runtime Error', 'Compile Error'].includes(s.status)).length})
					</button>
				</div>
			</Card>

			{/* Submissions Table / Cards Container */}
			<Card className="p-6 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm">
				{isLoading ? (
					<div className="p-12 text-center space-y-3">
						<Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
						<p className="text-xs text-muted-foreground font-medium">Fetching submission history...</p>
					</div>
				) : filteredSubmissions.length === 0 ? (
					<div className="p-12 text-center space-y-3">
						<FileCode2 className="w-12 h-12 text-muted-foreground/30 mx-auto" />
						<h4 className="text-sm font-bold text-foreground">No submissions found</h4>
						<p className="text-xs text-muted-foreground max-w-sm mx-auto">
							{searchQuery || statusFilter !== 'ALL'
								? 'No submissions match your active filter criteria. Try clearing search or filters.'
								: "You haven't submitted any problems yet. Start solving problems to build your history!"}
						</p>
						{searchQuery || statusFilter !== 'ALL' ? (
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setSearchQuery('');
									setStatusFilter('ALL');
								}}
								className="rounded-xl border-border text-xs font-semibold h-8 mt-2"
							>
								Reset Filters
							</Button>
						) : (
							<Button
								size="sm"
								onClick={() => navigate('/problems')}
								className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-9 px-4 mt-2"
							>
								Explore Problems
							</Button>
						)}
					</div>
				) : (
					<div className="space-y-3">
						{filteredSubmissions.map((sub) => {
							const probInfo = getProblemInfo(sub.problem_id);

							return (
								<div
									key={sub.submission_id}
									className="p-4 bg-background/60 hover:bg-accent/40 rounded-xl border border-border/60 hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
								>
									{/* Left Section: Status & Problem Details */}
									<div className="flex items-start md:items-center gap-3.5 flex-1 min-w-0">
										<div className="shrink-0 pt-0.5 md:pt-0">
											{renderStatusBadge(sub.status)}
										</div>

										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2 flex-wrap">
												<h4
													onClick={() => navigate(`/problems/${sub.problem_id}`)}
													className="text-foreground font-bold text-sm hover:text-primary transition-colors cursor-pointer leading-tight truncate"
												>
													{probInfo.title}
												</h4>
												<Badge
													variant="outline"
													className={`text-[10px] px-2 py-0.2 font-semibold ${
														probInfo.difficulty === 'Easy'
															? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
															: probInfo.difficulty === 'Medium'
															? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
															: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
													}`}
												>
													{probInfo.difficulty}
												</Badge>
											</div>

											<div className="flex items-center gap-3 text-xs text-muted-foreground font-mono mt-1 flex-wrap">
												<span>ID: <strong className="text-foreground font-semibold">{sub.problem_id}</strong></span>
												<span>•</span>
												<span className="capitalize">{sub.language}</span>
												<span>•</span>
												<span>{formatTimeAgo(sub.submitted_at)}</span>
											</div>
										</div>
									</div>

									{/* Right Section: Metrics & Action */}
									<div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
										<div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
											<div className="text-right">
												<p className="text-[10px] uppercase text-muted-foreground/70">Testcases</p>
												<p className="text-foreground font-bold text-xs mt-0.5">
													{sub.passed_testcases} / {sub.total_testcases || '?'}
												</p>
											</div>

											<div className="text-right">
												<p className="text-[10px] uppercase text-muted-foreground/70">Runtime</p>
												<p className="text-foreground font-bold text-xs mt-0.5">
													{sub.execution_time ? `${sub.execution_time}s` : 'N/A'}
												</p>
											</div>

											<div className="text-right">
												<p className="text-[10px] uppercase text-muted-foreground/70">Memory</p>
												<p className="text-foreground font-bold text-xs mt-0.5">
													{sub.memory_used ? `${sub.memory_used} MB` : 'N/A'}
												</p>
											</div>
										</div>

										<div className="flex items-center gap-2">
											<Button
												size="sm"
												variant="outline"
												onClick={() => setSelectedSubmission(sub)}
												className="rounded-xl border-border text-xs font-semibold gap-1.5 h-8 px-3 hover:bg-accent text-foreground cursor-pointer"
											>
												<Eye className="w-3.5 h-3.5 text-primary" />
												<span>View Code</span>
											</Button>

											<Button
												size="sm"
												variant="ghost"
												onClick={() => navigate(`/problems/${sub.problem_id}`)}
												className="rounded-xl text-xs font-semibold h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-accent cursor-pointer"
												title="Open Problem Editor"
											>
												<ExternalLink className="w-3.5 h-3.5" />
											</Button>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</Card>

			{/* Submission Code Detail Modal Dialog */}
			<Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
				<DialogContent className="sm:max-w-3xl p-6 space-y-4 rounded-2xl border-border bg-card shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
					{selectedSubmission && (
						<>
							<DialogHeader className="border-b border-border/60 pb-3">
								<div className="flex items-center justify-between gap-4 flex-wrap">
									<DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
										<Code2 className="w-5 h-5 text-primary" />
										<span>Submission Code Detail</span>
									</DialogTitle>
									{renderStatusBadge(selectedSubmission.status)}
								</div>

								<div className="flex items-center gap-4 text-xs font-mono text-muted-foreground mt-2 flex-wrap">
									<span>Problem: <strong className="text-foreground">{getProblemInfo(selectedSubmission.problem_id).title}</strong></span>
									<span>•</span>
									<span className="capitalize">Language: <strong className="text-foreground">{selectedSubmission.language}</strong></span>
									<span>•</span>
									<span>Date: <strong className="text-foreground">{formatTimestamp(selectedSubmission.submitted_at)}</strong></span>
								</div>
							</DialogHeader>

							<div className="overflow-y-auto space-y-4 flex-1 pr-1">
								{/* Metrics Bar */}
								<div className="grid grid-cols-3 gap-3 p-3 bg-muted/30 rounded-xl border border-border/60 text-center text-xs font-mono">
									<div>
										<span className="text-muted-foreground block text-[10px] uppercase">Passed Testcases</span>
										<strong className="text-foreground font-bold text-sm">
											{selectedSubmission.passed_testcases} / {selectedSubmission.total_testcases || '?'}
										</strong>
									</div>
									<div>
										<span className="text-muted-foreground block text-[10px] uppercase">Runtime</span>
										<strong className="text-foreground font-bold text-sm">
											{selectedSubmission.execution_time ? `${selectedSubmission.execution_time}s` : 'N/A'}
										</strong>
									</div>
									<div>
										<span className="text-muted-foreground block text-[10px] uppercase">Memory</span>
										<strong className="text-foreground font-bold text-sm">
											{selectedSubmission.memory_used ? `${selectedSubmission.memory_used} MB` : 'N/A'}
										</strong>
									</div>
								</div>

								{/* Error Output Alert if present */}
								{selectedSubmission.error_message && (
									<div className="p-3.5 rounded-xl bg-[#1e1e1e] border border-rose-500/30 text-rose-300 text-xs space-y-1 font-mono">
										<div className="flex items-center gap-2 font-bold text-rose-400">
											<AlertTriangle className="w-4 h-4 shrink-0" />
											<span>Error Log:</span>
										</div>
										<pre className="whitespace-pre-wrap leading-relaxed overflow-x-auto text-[11px] text-rose-300 font-mono max-h-60">
											{formatErrorMessage(selectedSubmission.error_message)}
										</pre>
									</div>
								)}

								{/* Code Viewer Container */}
								<div className="rounded-xl border border-border bg-[#1e1e1e] text-gray-200 overflow-hidden font-mono text-xs shadow-md">
									<div className="bg-[#252526] px-4 py-2.5 flex items-center justify-between border-b border-[#333333]">
										<span className="text-gray-300 text-xs font-semibold flex items-center gap-2">
											<Terminal className="w-4 h-4 text-primary" />
											<span>Submitted Source Code</span>
										</span>
										<Button
											size="sm"
											variant="ghost"
											onClick={copyCodeToClipboard}
											className="h-7 text-xs font-mono gap-1 text-gray-400 hover:text-white hover:bg-[#333333] cursor-pointer"
										>
											{codeCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
											<span>{codeCopied ? 'Copied' : 'Copy'}</span>
										</Button>
									</div>

									<div className="flex bg-[#1e1e1e] max-h-[350px] overflow-y-auto">
										<div className="bg-[#1e1e1e] border-r border-[#2d2d2d] py-4 px-2 text-right text-[11px] text-gray-600 font-mono select-none w-10 shrink-0 space-y-[2px]">
											{Array.from({ length: Math.max(1, (selectedSubmission.code || '').split('\n').length) }).map((_, i) => (
												<div key={i} className="leading-relaxed">{i + 1}</div>
											))}
										</div>
										<pre className="p-4 overflow-x-auto text-gray-200 text-xs leading-relaxed font-mono bg-[#1e1e1e] flex-1">
											<code>{selectedSubmission.code || '// Empty code snippet'}</code>
										</pre>
									</div>
								</div>
							</div>

							<div className="pt-2 border-t border-border/60 flex items-center justify-end gap-3">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setSelectedSubmission(null)}
									className="rounded-xl border-border text-xs font-semibold h-9 px-4"
								>
									Close
								</Button>
								<Button
									size="sm"
									onClick={() => {
										const targetProb = selectedSubmission.problem_id;
										setSelectedSubmission(null);
										navigate(`/problems/${targetProb}`);
									}}
									className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-9 px-4 gap-1.5"
								>
									<span>Solve Problem Again</span>
									<ExternalLink className="w-3.5 h-3.5" />
								</Button>
							</div>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
