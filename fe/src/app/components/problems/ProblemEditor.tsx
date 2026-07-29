import { useEffect, useState, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import {
	Play,
	Send,
	CheckCircle,
	Clock,
	TrendingUp,
	BookOpen,
	MessageCircle,
	ThumbsUp,
	ThumbsDown,
	Code2,
	Terminal,
	Check,
	XCircle,
	Settings2,
	ChevronRight,
	FileCode,
	Sparkles,
	History,
	RotateCcw,
	ChevronDown,
	ChevronUp,
	Plus,
	Trash2,
	Loader2,
	Repeat,
	Share2
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../ui/resizable';
import { useIsMobile } from '../ui/use-mobile';
import { useNavigate } from 'react-router-dom';
import { useProblem } from '../../context/ProblemContext';
import { PostRichTextEditor } from '../feed/PostRichTextEditor';
import { FormattedPostContent } from '../feed/FormattedPostContent';
import { useTheme } from '../shared/ThemeProvider';
import { useAuth } from '../../context/AuthContext';
import {
	getMySubmissionsApi,
	getProblemPostsApi,
	createPostApi,
	toggleLikePostApi,
	toggleRepostPostApi,
	addCommentApi,
	deletePostApi,
	deleteCommentApi,
	getAccessToken,
	PostItem,
	SubmissionResponseData
} from '../../services/api';

interface ProblemEditorProps {
	problemId: string | null;
}

const EXTENSIONS: Record<string, string> = {
	javascript: 'solution.js',
	python: 'solution.py',
	cpp: 'solution.cpp',
	java: 'Solution.java',
};

const MONACO_LANGUAGES: Record<string, string> = {
	javascript: 'javascript',
	python: 'python',
	cpp: 'cpp',
	java: 'java',
};

export function ProblemEditor({ problemId }: ProblemEditorProps) {
	const navigate = useNavigate();
	const { theme } = useTheme();
	const isMobile = useIsMobile();
	const {
		currentProblemId,
		problem,
		language,
		code,
		setCode,
		isRunning,
		isSubmitting,
		runCode,
		submitCode,
		showSubmitDialog,
		setShowSubmitDialog,
		testOutput,
		runResult,
		submissionResult,
		activeTab,
		setActiveTab,
		setCurrentProblemId,
	} = useProblem();

	const [selectedTestCase, setSelectedTestCase] = useState<number>(0);
	const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
	const [fontSize, setFontSize] = useState<number>(14);

	// State cho Submissions Tab
	const [submissionsList, setSubmissionsList] = useState<SubmissionResponseData[]>([]);
	const [isLoadingSubmissions, setIsLoadingSubmissions] = useState<boolean>(false);
	const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);

	const { user: currentUser } = useAuth();

	// State cho Discussions Tab
	const [discussionsList, setDiscussionsList] = useState<PostItem[]>([]);
	const [isLoadingDiscussions, setIsLoadingDiscussions] = useState<boolean>(false);
	const [isCreatingDiscussion, setIsCreatingDiscussion] = useState<boolean>(false);
	const [newDiscussionContent, setNewDiscussionContent] = useState<string>('');
	const [attachCodeSnippet, setAttachCodeSnippet] = useState<boolean>(false);
	const [newDiscussionTagInput, setNewDiscussionTagInput] = useState<string>('Discussion, Algorithm');
	const [isPostingDiscussion, setIsPostingDiscussion] = useState<boolean>(false);

	const [discOpenCommentsMap, setDiscOpenCommentsMap] = useState<Record<string, boolean>>({});
	const [discCommentInputsMap, setDiscCommentInputsMap] = useState<Record<string, string>>({});
	const [discCommentSubmittingMap, setDiscCommentSubmittingMap] = useState<Record<string, boolean>>({});

	const targetProblemId = problemId || currentProblemId || 'two-sum';

	const fetchDiscussions = useCallback(async () => {
		setIsLoadingDiscussions(true);
		try {
			const list = await getProblemPostsApi(targetProblemId);
			setDiscussionsList(list);
		} catch (err) {
			console.error('Failed to fetch problem discussions:', err);
		} finally {
			setIsLoadingDiscussions(false);
		}
	}, [targetProblemId]);

	useEffect(() => {
		fetchDiscussions();
	}, [fetchDiscussions]);

	const highlightCodeToHtml = (codeStr: string) => {
		if (!codeStr) return '';

		let escaped = codeStr
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');

		const comments: string[] = [];
		escaped = escaped.replace(/(#.*|\/\/.*)/g, (match) => {
			comments.push(match);
			return `§C${comments.length - 1}§`;
		});

		const strings: string[] = [];
		escaped = escaped.replace(/(".*?"|'.*?'|`.*?`)/g, (match) => {
			strings.push(match);
			return `§S${strings.length - 1}§`;
		});

		const keywords = /\b(def|class|return|if|elif|else|for|while|import|from|in|as|try|except|finally|raise|pass|lambda|const|let|var|function|async|await|public|private|static|void|int|float|double|char|bool|string|include|using|namespace|struct|interface|type)\b/g;
		escaped = escaped.replace(keywords, '<span class="syn-kw">$1</span>');

		const builtins = /\b(self|True|False|None|true|false|null|undefined|this|console|print|len|range|enumerate|zip|dict|list|set|int|str)\b/g;
		escaped = escaped.replace(builtins, '<span class="syn-bi">$1</span>');

		const numbers = /\b(\d+(\.\d+)?)\b/g;
		escaped = escaped.replace(numbers, '<span class="syn-num">$1</span>');

		const functions = /\b([a-zA-Z_]\w*)\s*\(/g;
		escaped = escaped.replace(functions, '<span class="syn-fn">$1</span>(');

		escaped = escaped.replace(/§S(\d+)§/g, (_, idx) => {
			return `<span class="syn-str">${strings[parseInt(idx)]}</span>`;
		});

		escaped = escaped.replace(/§C(\d+)§/g, (_, idx) => {
			return `<span class="syn-com">${comments[parseInt(idx)]}</span>`;
		});

		return escaped;
	};

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
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	};

	const isPostContentEmpty = (content: string) => {
		if (!content) return true;
		const text = content.replace(/<[^>]*>/g, '').trim();
		return text.length === 0;
	};

	const handleCreateDiscussionPost = async () => {
		if (isPostContentEmpty(newDiscussionContent)) return;

		const authToken = getAccessToken();
		if (!authToken) {
			navigate('/login');
			return;
		}

		setIsPostingDiscussion(true);
		try {
			const parsedTags = newDiscussionTagInput.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
			const payload: any = {
				content: newDiscussionContent.trim(),
				type: 'discussion',
				problem_id: targetProblemId,
				tags: parsedTags.length > 0 ? parsedTags : ['Discussion', 'Algorithm']
			};

			if (attachCodeSnippet && code) {
				payload.code_snippet = {
					filename: EXTENSIONS[language] || 'solution.py',
					language: language || 'python',
					code: code,
				};
			}

			const newPost = await createPostApi(authToken, payload);
			setDiscussionsList(prev => [newPost, ...prev]);
			setNewDiscussionContent('');
			setIsCreatingDiscussion(false);
		} catch (err: any) {
			console.error('Failed to create discussion:', err);
		} finally {
			setIsPostingDiscussion(false);
		}
	};

	const handleToggleLikeDiscussion = async (postId: string) => {
		const authToken = getAccessToken();
		if (!authToken) {
			navigate('/login');
			return;
		}
		const currentUserId = currentUser?.user_id || '';

		setDiscussionsList(prev =>
			prev.map(p => {
				if (p.post_id !== postId) return p;
				const isLiked = p.liked_by?.includes(currentUserId);
				const newLikedBy = isLiked
					? (p.liked_by || []).filter(id => id !== currentUserId)
					: [...(p.liked_by || []), currentUserId];
				const newLikesCount = isLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1;
				return { ...p, likes_count: newLikesCount, liked_by: newLikedBy };
			})
		);

		try {
			const updatedPost = await toggleLikePostApi(authToken, postId);
			setDiscussionsList(prev =>
				prev.map(p => (p.post_id === postId ? { ...p, likes_count: updatedPost.likes_count, liked_by: updatedPost.liked_by } : p))
			);
		} catch (err) {
			fetchDiscussions();
		}
	};

	const handleToggleRepostDiscussion = async (postId: string) => {
		const authToken = getAccessToken();
		if (!authToken) {
			navigate('/login');
			return;
		}
		const currentUserId = currentUser?.user_id || '';
		const targetDisc = discussionsList.find(d => d.post_id === postId);
		if (targetDisc && targetDisc.author_id === currentUserId) {
			return;
		}

		setDiscussionsList(prev =>
			prev.map(p => {
				if (p.post_id !== postId) return p;
				const isReposted = p.reposted_by?.includes(currentUserId);
				const newRepostedBy = isReposted
					? (p.reposted_by || []).filter(id => id !== currentUserId)
					: [...(p.reposted_by || []), currentUserId];
				const newRepostsCount = isReposted ? Math.max(0, (p.reposts_count || 0) - 1) : (p.reposts_count || 0) + 1;
				return { ...p, reposts_count: newRepostsCount, reposted_by: newRepostedBy };
			})
		);

		try {
			const updatedPost = await toggleRepostPostApi(authToken, postId);
			setDiscussionsList(prev =>
				prev.map(p => (p.post_id === postId ? { ...p, reposts_count: updatedPost.reposts_count, reposted_by: updatedPost.reposted_by } : p))
			);
		} catch (err) {
			fetchDiscussions();
		}
	};

	const handleAddCommentDiscussion = async (postId: string) => {
		const commentText = (discCommentInputsMap[postId] || '').trim();
		if (!commentText) return;

		const authToken = getAccessToken();
		if (!authToken) {
			navigate('/login');
			return;
		}

		setDiscCommentSubmittingMap(prev => ({ ...prev, [postId]: true }));
		try {
			const updatedPost = await addCommentApi(authToken, postId, commentText);
			setDiscussionsList(prev => prev.map(p => (p.post_id === postId ? updatedPost : p)));
			setDiscCommentInputsMap(prev => ({ ...prev, [postId]: '' }));
		} catch (err) {
			console.error('Failed to add comment:', err);
		} finally {
			setDiscCommentSubmittingMap(prev => ({ ...prev, [postId]: false }));
		}
	};

	const handleDeleteCommentDiscussion = async (postId: string, commentId: string) => {
		const authToken = getAccessToken();
		if (!authToken) return;

		try {
			const updatedPost = await deleteCommentApi(authToken, postId, commentId);
			setDiscussionsList(prev => prev.map(p => (p.post_id === postId ? updatedPost : p)));
		} catch (err) {
			console.error('Failed to delete comment:', err);
		}
	};

	const handleDeleteDiscussionPost = async (postId: string) => {
		const authToken = getAccessToken();
		if (!authToken) return;

		try {
			await deletePostApi(authToken, postId);
			setDiscussionsList(prev => prev.filter(p => p.post_id !== postId));
		} catch (err) {
			console.error('Failed to delete discussion:', err);
		}
	};

	useEffect(() => {
		if (problemId) {
			setCurrentProblemId(problemId);
		}
	}, [problemId, setCurrentProblemId]);

	const fetchSubmissions = useCallback(async () => {
		setIsLoadingSubmissions(true);
		try {
			const list = await getMySubmissionsApi(targetProblemId);
			setSubmissionsList(list);
		} catch (err) {
			console.error('Failed to fetch submissions:', err);
		} finally {
			setIsLoadingSubmissions(false);
		}
	}, [targetProblemId]);

	useEffect(() => {
		fetchSubmissions();
	}, [fetchSubmissions, submissionResult]);

	const filename = EXTENSIONS[language] || 'solution.js';
	const monacoLang = MONACO_LANGUAGES[language] || 'javascript';

	const handleEditorDidMount: OnMount = (editor) => {
		editor.onDidChangeCursorPosition((e) => {
			setCursorPos({
				line: e.position.lineNumber,
				column: e.position.column,
			});
		});

		// Add keyboard shortcut: Ctrl+Enter to Run
		editor.addCommand(window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.Enter, () => {
			runCode();
		});
	};

	return (
		<div className="h-[calc(100vh-56px)] flex flex-col bg-background text-foreground overflow-hidden select-none">
			{/* Main IDE Resizable Layout: Problem Spec Pane | Monaco Code Editor & Terminal Pane */}
			<ResizablePanelGroup
				direction={isMobile ? 'vertical' : 'horizontal'}
				className="flex-1 overflow-hidden"
			>
				{/* LEFT PANE: Problem Description, Examples, Submissions, Solutions, Discussions */}
				<ResizablePanel
					defaultSize={isMobile ? 40 : 45}
					minSize={20}
					maxSize={80}
					className="h-full bg-card/20 flex flex-col overflow-hidden"
				>
					<div className="p-4 sm:p-6 flex-1 flex flex-col min-h-0 overflow-hidden">
						<Tabs defaultValue="description" className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">
							<TabsList className="mb-4 bg-muted/60 p-1 rounded-xl flex-wrap h-auto gap-1 shrink-0">
								<TabsTrigger value="description" className="rounded-lg text-xs font-semibold px-3.5 py-1.5">
									Description
								</TabsTrigger>
								<TabsTrigger value="submissions" className="rounded-lg text-xs font-semibold px-3.5 py-1.5 flex items-center gap-1.5">
									<History className="w-3.5 h-3.5" />
									<span>Submissions</span>
								</TabsTrigger>
								<TabsTrigger value="solutions" className="rounded-lg text-xs font-semibold px-3.5 py-1.5">
									Solutions
								</TabsTrigger>
								<TabsTrigger value="discussions" className="rounded-lg text-xs font-semibold px-3.5 py-1.5">
									Discussions
								</TabsTrigger>
							</TabsList>

							{/* Description Content */}
							<TabsContent value="description" className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
								<div>
									<h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2 flex-wrap">
										<span>{problem.title}</span>
										<Badge
											variant="outline"
											className={`text-xs px-2.5 py-0.5 font-medium border ${
												problem.difficulty === 'Easy'
													? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
													: problem.difficulty === 'Medium'
													? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
													: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
											}`}
										>
											{problem.difficulty}
										</Badge>
									</h2>
									<p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">
										{problem.description}
									</p>
								</div>

								<div>
									<h3 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">
										Examples
									</h3>
									<div className="space-y-3">
										{problem.examples.map((example, index) => (
											<Card key={index} className="p-4 bg-muted/40 border-border/60 rounded-xl space-y-2">
												<div className="flex items-center gap-2 text-xs font-semibold text-foreground">
													<Sparkles className="w-3.5 h-3.5 text-primary" />
													<span>Example {index + 1}</span>
												</div>
												<div className="space-y-1.5 font-mono text-xs leading-relaxed bg-background/60 p-3 rounded-lg border border-border/40 overflow-x-auto">
													<div>
														<span className="text-muted-foreground font-semibold">Input: </span>
														<span className="text-foreground">{example.input}</span>
													</div>
													<div>
														<span className="text-muted-foreground font-semibold">Output: </span>
														<span className="text-primary font-semibold">{example.output}</span>
													</div>
													{example.explanation && (
														<div className="pt-1 text-muted-foreground border-t border-border/40 text-[11px]">
															<span className="font-semibold text-muted-foreground">Explanation: </span>
															{example.explanation}
														</div>
													)}
												</div>
											</Card>
										))}
									</div>
								</div>

								<div>
									<h3 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">
										Constraints
									</h3>
									<ul className="space-y-1.5 text-muted-foreground text-xs font-mono bg-muted/30 p-3.5 rounded-xl border border-border/40">
										{problem.constraints.map((constraint, index) => (
											<li key={index} className="flex items-center gap-2">
												<span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0"></span>
												<span>{constraint}</span>
											</li>
										))}
									</ul>
								</div>

								<div className="pt-4 border-t border-border/60">
									<div className="grid grid-cols-2 gap-4">
										<div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
											<TrendingUp className="w-5 h-5 text-emerald-500 shrink-0" />
											<div className="min-w-0">
												<p className="text-muted-foreground text-xs truncate">Acceptance Rate</p>
												<p className="text-foreground font-bold text-sm">{problem.acceptance}</p>
											</div>
										</div>
										<div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
											<BookOpen className="w-5 h-5 text-blue-500 shrink-0" />
											<div className="min-w-0">
												<p className="text-muted-foreground text-xs truncate">Submissions</p>
												<p className="text-foreground font-bold text-sm">{problem.submissions}</p>
											</div>
										</div>
									</div>
								</div>

								<div className="flex items-center gap-2 pt-2">
									<Button variant="outline" size="sm" className="gap-2 rounded-xl h-8 text-xs border-border">
										<ThumbsUp className="w-3.5 h-3.5" />
										<span>1.2K</span>
									</Button>
									<Button variant="outline" size="sm" className="gap-2 rounded-xl h-8 text-xs border-border">
										<ThumbsDown className="w-3.5 h-3.5" />
										<span>89</span>
									</Button>
								</div>
							</TabsContent>

							{/* TAB SUBMISSIONS: Hiển thị các bài nộp của user đối với bài toán này */}
							<TabsContent value="submissions" className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
								<div className="flex items-center justify-between sticky top-0 bg-card/90 backdrop-blur-sm z-10 py-1">
									<h3 className="text-sm font-bold text-foreground flex items-center gap-2">
										<History className="w-4 h-4 text-primary" />
										<span>My Submissions ({submissionsList.length})</span>
									</h3>
									<Button
										variant="ghost"
										size="sm"
										onClick={fetchSubmissions}
										disabled={isLoadingSubmissions}
										className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
									>
										<RotateCcw className={`w-3.5 h-3.5 ${isLoadingSubmissions ? 'animate-spin' : ''}`} />
										<span>Refresh</span>
									</Button>
								</div>

								{isLoadingSubmissions ? (
									<div className="p-8 text-center text-xs text-muted-foreground font-mono flex items-center justify-center gap-2">
										<RotateCcw className="w-4 h-4 animate-spin text-primary" />
										<span>Loading submission history...</span>
									</div>
								) : submissionsList.length === 0 ? (
									<div className="p-8 rounded-xl bg-muted/20 border border-border/60 text-center space-y-2">
										<History className="w-8 h-8 mx-auto text-muted-foreground/60" />
										<p className="text-sm font-semibold text-foreground">No Submissions Yet</p>
										<p className="text-xs text-muted-foreground">Submit your solution to see your evaluation history here.</p>
									</div>
								) : (
									<div className="space-y-3">

										{submissionsList.map((sub) => {
											const isExpanded = expandedSubmissionId === sub.submission_id;
											const isAccepted = sub.status === 'Accepted';
											const isPending = sub.status === 'Pending';

											return (
												<Card
													key={sub.submission_id}
													className={`p-4 border transition-all rounded-xl cursor-pointer ${
														isAccepted
															? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60'
															: isPending
															? 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60'
															: 'border-rose-500/30 bg-rose-500/5 hover:border-rose-500/60'
													}`}
													onClick={() => setExpandedSubmissionId(isExpanded ? null : sub.submission_id)}
												>
													<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
														<div className="flex items-center gap-3">
															<Badge
																variant="outline"
																className={`text-xs px-2.5 py-0.5 font-semibold gap-1.5 shrink-0 ${
																	isAccepted
																		? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
																		: isPending
																		? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
																		: 'bg-rose-500/10 text-rose-500 border-rose-500/30'
																}`}
															>
																{isAccepted ? (
																	<CheckCircle className="w-3.5 h-3.5" />
																) : isPending ? (
																	<Clock className="w-3.5 h-3.5 animate-spin" />
																) : (
																	<XCircle className="w-3.5 h-3.5" />
																)}
																<span>{sub.status}</span>
															</Badge>

															<span className="text-xs font-mono uppercase font-semibold text-primary/90 bg-primary/10 px-2 py-0.5 rounded shrink-0">
																{sub.language}
															</span>
														</div>

														<div className="flex items-center gap-3 text-xs font-mono text-muted-foreground shrink-0 flex-wrap">
															<div className="flex items-center gap-1">
																<Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
																<span>{sub.execution_time}s</span>
															</div>
															<span>•</span>
															<span>{sub.passed_testcases}/{sub.total_testcases} passed</span>
															<span>•</span>
															<span className="text-muted-foreground/60">{formatTimeAgo(sub.submitted_at)}</span>
															{isExpanded ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4" />}
														</div>
													</div>

													{/* Details & Submitted Code Viewer */}
													{isExpanded && (
														<div className="mt-4 pt-3 border-t border-border/60 space-y-3" onClick={(e) => e.stopPropagation()}>
															{sub.error_message && (
																<div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 font-mono text-xs whitespace-pre-wrap">
																	<p className="font-bold text-rose-400 mb-1">Output / Error Log:</p>
																	{sub.error_message}
																</div>
															)}

															<div className="space-y-1">
																<p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
																	<Code2 className="w-3.5 h-3.5 text-primary" />
																	<span>Submitted Code:</span>
																</p>
																<pre className="p-3 bg-[#1e1e1e] text-gray-200 rounded-lg border border-gray-800 font-mono text-xs overflow-x-auto max-h-60 leading-relaxed">
																	{sub.code}
																</pre>
															</div>
														</div>
													)}
												</Card>
											);
										})}
									</div>
								)}
							</TabsContent>

							<TabsContent value="solutions" className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
								<div className="p-6 rounded-xl bg-muted/20 border border-border text-center text-muted-foreground text-sm space-y-2">
									<Code2 className="w-10 h-10 mx-auto text-primary opacity-80" />
									<p className="font-medium text-foreground">Official Solutions Locked</p>
									<p className="text-xs text-muted-foreground">Solutions will unlock after your first successful submission.</p>
								</div>
							</TabsContent>

							<TabsContent value="discussions" className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
								{/* Header & Create Discussion Trigger */}
								<div className="flex items-center justify-between sticky top-0 bg-card/90 backdrop-blur-sm z-10 py-1 border-b border-border/40 pb-2">
									<h3 className="text-sm font-bold text-foreground flex items-center gap-2">
										<MessageCircle className="w-4 h-4 text-primary" />
										<span>Problem Discussions ({discussionsList.length})</span>
									</h3>
									<div className="flex items-center gap-2">
										<Button
											variant="ghost"
											size="sm"
											onClick={fetchDiscussions}
											disabled={isLoadingDiscussions}
											className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
										>
											<RotateCcw className={`w-3.5 h-3.5 ${isLoadingDiscussions ? 'animate-spin' : ''}`} />
										</Button>
										<Button
											size="sm"
											onClick={() => setIsCreatingDiscussion(prev => !prev)}
											className="h-8 rounded-xl px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 font-semibold cursor-pointer"
										>
											<Plus className="w-3.5 h-3.5" />
											<span>New Discussion</span>
										</Button>
									</div>
								</div>

								{/* Inline Discussion Creator Form */}
								{isCreatingDiscussion && (
									<Card className="p-4 bg-muted/30 border-border/80 rounded-2xl space-y-3 shadow-md">
										<div className="flex items-center gap-3">
											<Avatar className="w-8 h-8 border border-border">
												<AvatarImage src={currentUser?.avatar_url} />
												<AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
													{currentUser?.full_name?.substring(0, 2).toUpperCase() || 'DEV'}
												</AvatarFallback>
											</Avatar>
											<span className="text-xs font-bold text-foreground">Post a new discussion for this problem</span>
										</div>

										<PostRichTextEditor
											value={newDiscussionContent}
											onChange={setNewDiscussionContent}
											placeholder="Ask a question, share an optimal solution idea, or start a discussion..."
										/>

										<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
											<label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
												<input
													type="checkbox"
													checked={attachCodeSnippet}
													onChange={(e) => setAttachCodeSnippet(e.target.checked)}
													className="rounded border-border text-primary focus:ring-primary"
												/>
												<Code2 className="w-3.5 h-3.5 text-primary" />
												<span>Attach current code solution</span>
											</label>

											<div className="flex items-center gap-2 justify-end">
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() => setIsCreatingDiscussion(false)}
													className="h-8 rounded-xl text-xs"
												>
													Cancel
												</Button>
												<Button
													type="button"
													size="sm"
													disabled={isPostingDiscussion || isPostContentEmpty(newDiscussionContent)}
													onClick={handleCreateDiscussionPost}
													className="h-8 rounded-xl px-4 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 font-semibold"
												>
													{isPostingDiscussion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
													<span>Post Discussion</span>
												</Button>
											</div>
										</div>
									</Card>
								)}

								{/* Discussions Stream */}
								{isLoadingDiscussions ? (
									<div className="p-8 text-center text-xs text-muted-foreground font-mono flex items-center justify-center gap-2">
										<RotateCcw className="w-4 h-4 animate-spin text-primary" />
										<span>Loading discussions...</span>
									</div>
								) : discussionsList.length === 0 ? (
									<div className="p-8 rounded-2xl bg-muted/20 border border-border/60 text-center space-y-2">
										<MessageCircle className="w-8 h-8 mx-auto text-muted-foreground/60" />
										<p className="text-sm font-semibold text-foreground">No Discussions Yet</p>
										<p className="text-xs text-muted-foreground">Be the first to start a conversation or share a solution for this problem!</p>
									</div>
								) : (
									<div className="space-y-4">
										{discussionsList.map((disc) => {
											const isLiked = currentUser?.user_id ? disc.liked_by?.includes(currentUser.user_id) : false;
											const isReposted = currentUser?.user_id ? disc.reposted_by?.includes(currentUser.user_id) : false;
											const isOwner = currentUser?.user_id === disc.author_id;
											const isCommentsOpen = !!discOpenCommentsMap[disc.post_id];

											return (
												<Card key={disc.post_id} className="p-4 border-border/80 bg-card rounded-2xl space-y-3 hover:border-border transition-all">
													{/* Author Row */}
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-2.5">
															<Avatar className="w-8 h-8 border border-border">
																<AvatarImage src={disc.author_avatar} />
																<AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
																	{disc.author_name?.substring(0, 2).toUpperCase() || 'DEV'}
																</AvatarFallback>
															</Avatar>
															<div>
																<h4 className="text-xs font-bold text-foreground">{disc.author_name}</h4>
																<p className="text-[10px] text-muted-foreground">{disc.author_title || 'CodExecute Member'}</p>
															</div>
														</div>
														<div className="flex items-center gap-2">
															<span className="text-[11px] text-muted-foreground">{formatTimeAgo(disc.created_at)}</span>
															{isOwner && (
																<Button
																	variant="ghost"
																	size="icon"
																	onClick={() => handleDeleteDiscussionPost(disc.post_id)}
																	className="h-7 w-7 text-muted-foreground hover:text-rose-500 cursor-pointer"
																>
																	<Trash2 className="w-3.5 h-3.5" />
																</Button>
															)}
														</div>
													</div>

													{/* Content */}
													<FormattedPostContent content={disc.content} className="text-xs" />

													{/* Attached Code Snippet if present */}
													{disc.code_snippet && (
														<div className="rounded-xl border border-border bg-[#1e1e1e] overflow-hidden font-mono text-xs">
															<div className="bg-[#252526] px-3 py-1.5 flex items-center justify-between border-b border-[#333333] text-[11px] text-gray-300">
																<span className="flex items-center gap-1.5 text-primary">
																	<Code2 className="w-3.5 h-3.5" />
																	{disc.code_snippet.filename || 'solution.py'}
																</span>
																<span className="uppercase text-[10px] bg-[#333] px-1.5 py-0.5 rounded text-gray-400">
																	{disc.code_snippet.language || 'code'}
																</span>
															</div>
															<pre
																className="p-3.5 text-gray-200 overflow-x-auto max-h-60 leading-relaxed font-mono whitespace-pre"
																dangerouslySetInnerHTML={{ __html: highlightCodeToHtml(disc.code_snippet.code) }}
															/>
														</div>
													)}

													{/* Tags */}
													{disc.tags && disc.tags.length > 0 && (
														<div className="flex flex-wrap gap-1.5 pt-1">
															{disc.tags.map(t => (
																<span key={t} className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-md font-mono">
																	#{t}
																</span>
															))}
														</div>
													)}

													{/* Action Bar */}
													<div className="flex items-center gap-4 pt-2 border-t border-border/40 text-xs text-muted-foreground">
														<button
															onClick={() => handleToggleLikeDiscussion(disc.post_id)}
															className={`flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer ${
																isLiked ? 'text-primary font-bold' : ''
															}`}
														>
															<ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-primary' : ''}`} />
															<span>{disc.likes_count || 0}</span>
														</button>

														<button
															onClick={() => setDiscOpenCommentsMap(prev => ({ ...prev, [disc.post_id]: !prev[disc.post_id] }))}
															className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
														>
															<MessageCircle className="w-3.5 h-3.5" />
															<span>{disc.comments?.length || 0}</span>
														</button>

														<button
															disabled={isOwner}
															title={isOwner ? "Bạn không thể chia sẻ lại bài viết của chính mình" : undefined}
															onClick={() => !isOwner && handleToggleRepostDiscussion(disc.post_id)}
															className={`flex items-center gap-1.5 transition-colors ${
																isOwner
																	? 'opacity-40 cursor-not-allowed text-muted-foreground'
																	: isReposted
																	? 'text-emerald-500 font-bold hover:text-emerald-500'
																	: 'hover:text-emerald-500 cursor-pointer'
															}`}
														>
															<Repeat className="w-3.5 h-3.5" />
															<span>{disc.reposts_count || 0}</span>
														</button>
													</div>

													{/* Comments Section */}
													{isCommentsOpen && (
														<div className="pt-3 border-t border-border/40 space-y-3">
															{/* Input reply */}
															<div className="flex gap-2">
																<input
																	type="text"
																	value={discCommentInputsMap[disc.post_id] || ''}
																	onChange={(e) => setDiscCommentInputsMap(prev => ({ ...prev, [disc.post_id]: e.target.value }))}
																	onKeyDown={(e) => {
																		if (e.key === 'Enter') handleAddCommentDiscussion(disc.post_id);
																	}}
																	placeholder="Write a reply..."
																	className="flex-1 px-3 py-1.5 bg-background rounded-xl border border-border text-foreground text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
																/>
																<Button
																	size="sm"
																	disabled={discCommentSubmittingMap[disc.post_id] || !(discCommentInputsMap[disc.post_id] || '').trim()}
																	onClick={() => handleAddCommentDiscussion(disc.post_id)}
																	className="rounded-xl px-3 h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
																>
																	{discCommentSubmittingMap[disc.post_id] ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Reply'}
																</Button>
															</div>

															{/* Comments List */}
															{disc.comments && disc.comments.length > 0 && (
																<div className="space-y-2 pt-1">
																	{disc.comments.map(c => (
																		<div key={c.comment_id} className="p-2.5 rounded-xl bg-muted/40 border border-border/40 text-xs space-y-1">
																			<div className="flex items-center justify-between">
																				<div className="flex items-center gap-2">
																					<Avatar className="w-5 h-5 border border-border">
																						<AvatarImage src={c.user_avatar} />
																						<AvatarFallback className="bg-primary text-primary-foreground font-bold text-[9px]">
																							{c.user_name?.substring(0, 2).toUpperCase() || 'U'}
																						</AvatarFallback>
																					</Avatar>
																					<span className="font-semibold text-foreground text-[11px]">{c.user_name}</span>
																					<span className="text-[10px] text-muted-foreground">{formatTimeAgo(c.created_at)}</span>
																				</div>
																				{currentUser?.user_id === c.user_id && (
																					<button
																						onClick={() => handleDeleteCommentDiscussion(disc.post_id, c.comment_id)}
																						className="text-muted-foreground hover:text-rose-500 text-[10px] cursor-pointer"
																					>
																						Delete
																					</button>
																				)}
																			</div>
																			<p className="text-foreground text-xs pl-7">{c.content}</p>
																		</div>
																	))}
																</div>
															)}
														</div>
													)}
												</Card>
											);
										})}
									</div>
								)}
							</TabsContent>
						</Tabs>
					</div>
				</ResizablePanel>

				{/* Resizable Handle: Left Pane | Right Pane */}
				<ResizableHandle withHandle />

				{/* RIGHT PANE: Code Editor (Top) & Integrated Terminal Drawer (Bottom) */}
				<ResizablePanel
					defaultSize={isMobile ? 60 : 55}
					minSize={20}
					maxSize={80}
					className="h-full overflow-hidden"
				>
					<ResizablePanelGroup direction="vertical" className="h-full w-full">
						{/* TOP SUB-PANE: Monaco Code Editor */}
						<ResizablePanel
							defaultSize={65}
							minSize={25}
							maxSize={85}
							className="h-full flex flex-col bg-[#1e1e1e] text-gray-200 overflow-hidden"
						>
							{/* VS Code File Tab Bar */}
							<div className="bg-[#252526] border-b border-[#333333] flex items-center justify-between px-3 h-10 shrink-0">
								{/* Left: Window Dots & File Tab */}
								<div className="flex items-center gap-3">
									<div className="flex items-center gap-1.5">
										<div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
										<div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
										<div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
									</div>

									<div className="flex items-center gap-2 bg-[#1e1e1e] text-primary px-3 py-1 rounded-t-md text-xs font-mono font-medium border-t-2 border-primary shadow-inner">
										<FileCode className="w-3.5 h-3.5 text-primary" />
										<span>{filename}</span>
									</div>
								</div>

								{/* Right: IDE Controls & Hotkeys Info */}
								<div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono">
									<span className="hidden sm:inline-flex items-center gap-1 bg-[#1e1e1e] px-2 py-0.5 rounded border border-gray-700/60 text-gray-400">
										<kbd className="text-gray-300">Ctrl</kbd>+<kbd className="text-gray-300">Enter</kbd> to Run
									</span>

									<div className="flex items-center gap-1">
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6 text-gray-400 hover:text-white hover:bg-gray-700/50"
											onClick={() => setFontSize(prev => Math.max(12, prev - 1))}
											title="Decrease font size"
										>
											<span className="text-xs font-bold">A-</span>
										</Button>
										<span className="text-xs">{fontSize}px</span>
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6 text-gray-400 hover:text-white hover:bg-gray-700/50"
											onClick={() => setFontSize(prev => Math.min(20, prev + 1))}
											title="Increase font size"
										>
											<span className="text-xs font-bold">A+</span>
										</Button>
									</div>
								</div>
							</div>

							{/* IDE Breadcrumbs Bar */}
							<div className="bg-[#1e1e1e] border-b border-[#2d2d2d] px-4 py-1 flex items-center gap-1 text-[11px] font-mono text-gray-400 shrink-0 overflow-x-auto">
								<span className="hover:text-gray-200 cursor-pointer">src</span>
								<ChevronRight className="w-3 h-3 text-gray-600 shrink-0" />
								<span className="hover:text-gray-200 cursor-pointer">{filename}</span>
								<ChevronRight className="w-3 h-3 text-gray-600 shrink-0" />
								<span className="text-primary font-semibold truncate">twoSum</span>
							</div>

							{/* Monaco Editor Container */}
							<div className="flex-1 relative overflow-hidden bg-[#1e1e1e]">
								<Editor
									height="100%"
									language={monacoLang}
									theme={theme === 'dark' ? 'vs-dark' : 'vs-dark'}
									value={code}
									onChange={(val) => setCode(val || '')}
									onMount={handleEditorDidMount}
									loading={
										<div className="flex items-center justify-center h-full text-gray-400 text-xs font-mono gap-2">
											<Code2 className="w-5 h-5 animate-spin text-primary" />
											<span>Loading Monaco Editor...</span>
										</div>
									}
									options={{
										fontSize: fontSize,
										fontFamily: "'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace",
										fontLigatures: true,
										minimap: { enabled: false },
										scrollBeyondLastLine: false,
										automaticLayout: true,
										tabSize: 4,
										lineNumbers: 'on',
										renderLineHighlight: 'all',
										padding: { top: 12, bottom: 12 },
										cursorBlinking: 'smooth',
										cursorSmoothCaretAnimation: 'on',
										smoothScrolling: true,
										bracketPairColorization: { enabled: true },
										suggestOnTriggerCharacters: true,
										quickSuggestions: true,
										wordWrap: 'on',
										folding: true,
									}}
								/>
							</div>

							{/* VS Code Editor Bottom Status Bar */}
							<div className="bg-[#007acc] text-white px-3 py-0.5 flex items-center justify-between text-[11px] font-mono shrink-0 select-none overflow-x-auto">
								<div className="flex items-center gap-3 shrink-0">
									<span className="flex items-center gap-1 font-semibold">
										<Terminal className="w-3 h-3" />
										<span>CodExecute IDE</span>
									</span>
									<span>•</span>
									<span>UTF-8</span>
									<span>•</span>
									<span>{monacoLang.toUpperCase()}</span>
								</div>
								<div className="flex items-center gap-4 shrink-0">
									<span>Ln {cursorPos.line}, Col {cursorPos.column}</span>
									<span className="hidden sm:inline">Spaces: 4</span>
									<Settings2 className="w-3 h-3 cursor-pointer hover:opacity-80" />
								</div>
							</div>
						</ResizablePanel>

						{/* Resizable Handle: Code Editor | Output & Testcases */}
						<ResizableHandle withHandle />

						{/* BOTTOM SUB-PANE: Code Output & Testcase Terminal */}
						<ResizablePanel
							defaultSize={35}
							minSize={15}
							maxSize={75}
							className="h-full flex flex-col bg-[#181818] overflow-hidden"
						>
							<Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col overflow-hidden">
								<div className="px-3 pt-2 bg-[#252526] border-b border-[#333333] flex items-center justify-between shrink-0">
									<TabsList className="bg-[#1e1e1e] border border-gray-700/60 p-0.5 rounded-lg">
										<TabsTrigger value="testcase" className="text-xs text-gray-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-3 py-1 font-medium transition-all">
											Testcase
										</TabsTrigger>
										<TabsTrigger value="result" className="text-xs text-gray-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-3 py-1 font-medium transition-all">
											Test Result
										</TabsTrigger>
									</TabsList>

									{testOutput && (
										<Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono gap-1">
											<Check className="w-3 h-3" />
											<span>Accepted</span>
										</Badge>
									)}
								</div>

								{/* Testcase Input View */}
								<TabsContent value="testcase" className="px-4 py-3 m-0 space-y-3 flex-1 overflow-y-auto">
									<div className="flex items-center gap-2 overflow-x-auto pb-1">
										{problem.examples.map((_, idx) => (
											<button
												key={idx}
												onClick={() => setSelectedTestCase(idx)}
												className={`px-3 py-1 rounded-lg text-xs font-mono transition-all shrink-0 ${
													selectedTestCase === idx
														? 'bg-primary text-primary-foreground font-semibold shadow-sm'
														: 'bg-[#252526] text-gray-400 hover:text-gray-200 border border-gray-700/60'
												}`}
											>
												Case {idx + 1}
											</button>
										))}
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										<div className="bg-[#1e1e1e] rounded-xl p-3 border border-gray-800 space-y-2">
											<p className="text-gray-400 text-xs font-mono">Input:</p>
											<div className="bg-[#252526] p-2.5 rounded-lg border border-gray-700/60 font-mono text-xs text-gray-200 overflow-x-auto whitespace-pre-wrap">
												{problem.examples[selectedTestCase]?.input || 'nums = [2,7,11,15], target = 9'}
											</div>
										</div>

										<div className="bg-[#1e1e1e] rounded-xl p-3 border border-gray-800 space-y-2">
											<p className="text-gray-400 text-xs font-mono">Expected Output:</p>
											<div className="bg-[#252526] p-2.5 rounded-lg border border-gray-700/60 font-mono text-xs text-emerald-400 font-semibold overflow-x-auto whitespace-pre-wrap">
												{problem.examples[selectedTestCase]?.output || ''}
											</div>
										</div>
									</div>
								</TabsContent>

								{/* Test Result Execution Output View */}
								<TabsContent value="result" className="px-4 py-3 m-0 flex-1 overflow-y-auto">
									{isRunning ? (
										<div className="flex items-center gap-2 text-amber-400 text-xs font-mono py-2">
											<Play className="w-4 h-4 animate-spin" />
											Running sample testcases in sandbox...
										</div>
									) : runResult ? (
										<div className="space-y-3 font-mono text-xs">
											{/* Performance Stats */}
											<div className={`flex items-center gap-4 font-bold p-3 rounded-xl border flex-wrap ${
												runResult.status === 'Accepted'
													? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
													: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
											}`}>
												<div className="flex items-center gap-1.5">
													{runResult.status === 'Accepted' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
													<span>{runResult.status}</span>
												</div>
												<span className="text-gray-600 hidden sm:inline">|</span>
												<div className="flex items-center gap-1 text-gray-300 font-normal">
													<span>Passed: <strong className="text-emerald-400">{runResult.passed_testcases} / {runResult.total_testcases}</strong></span>
												</div>
												<span className="text-gray-600 hidden sm:inline">|</span>
												<div className="flex items-center gap-1 text-gray-300 font-normal">
													<Clock className="w-3.5 h-3.5 text-emerald-400" />
													<span>Runtime: <strong className="text-emerald-400">{runResult.execution_time} s</strong></span>
												</div>
											</div>

											{/* Detailed Diff / Error Details */}
											{runResult.error_message && (
												<div className="bg-[#1e1e1e] rounded-xl p-3 border border-rose-500/30 text-rose-300 font-mono text-xs whitespace-pre-wrap">
													{runResult.error_message}
												</div>
											)}
										</div>
									) : testOutput ? (
										<div className="space-y-3 font-mono text-xs whitespace-pre-wrap bg-[#1e1e1e] p-3 rounded-xl border border-gray-800 text-gray-200">
											{testOutput}
										</div>
									) : (
										<div className="text-gray-500 text-xs font-mono py-2 flex items-center gap-2">
											<XCircle className="w-4 h-4 text-gray-600" />
											<span>Click &quot;Run&quot; (runs sample testcases without saving) or &quot;Submit&quot; (evaluates full testcases) in header.</span>
										</div>
									)}
								</TabsContent>
							</Tabs>
						</ResizablePanel>
					</ResizablePanelGroup>
				</ResizablePanel>
			</ResizablePanelGroup>

			{/* Submission Modal Dialog */}
			<Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
				<DialogContent className="max-w-xl rounded-2xl p-6 border-border bg-card">
					<DialogHeader>
						<div className="flex items-center gap-3 mb-4">
							<div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
								isSubmitting
									? 'bg-blue-500/10 border-blue-500/20'
									: submissionResult?.status === 'Accepted'
									? 'bg-emerald-500/10 border-emerald-500/20'
									: 'bg-rose-500/10 border-rose-500/20'
							}`}>
								{isSubmitting ? (
									<Play className="w-7 h-7 text-blue-500 animate-spin" />
								) : submissionResult?.status === 'Accepted' ? (
									<CheckCircle className="w-7 h-7 text-emerald-500" />
								) : (
									<XCircle className="w-7 h-7 text-rose-500" />
								)}
							</div>
							<div>
								<DialogTitle className={`text-2xl font-bold ${
									isSubmitting
										? 'text-blue-500'
										: submissionResult?.status === 'Accepted'
										? 'text-emerald-500'
										: 'text-rose-500'
								}`}>
									{isSubmitting ? 'Evaluating Code...' : submissionResult?.status || 'Submission Result'}
								</DialogTitle>
								<DialogDescription className="text-muted-foreground text-xs">
									{isSubmitting
										? 'Your code has been queued and is executing against full testcases.'
										: submissionResult?.status === 'Accepted'
										? 'Congratulations! Your code passed all full testcases.'
										: 'Your submission did not pass all testcases.'}
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-3">
							<Card className="p-4 bg-emerald-500/5 border-emerald-500/20 rounded-xl">
								<div className="flex items-center gap-3">
									<Clock className="w-6 h-6 text-emerald-500" />
									<div>
										<p className="text-muted-foreground text-xs">Runtime</p>
										<p className="text-foreground font-bold text-sm">
											{submissionResult ? `${submissionResult.execution_time} s` : '--'}
										</p>
									</div>
								</div>
							</Card>
							<Card className="p-4 bg-blue-500/5 border-blue-500/20 rounded-xl">
								<div className="flex items-center gap-3">
									<TrendingUp className="w-6 h-6 text-blue-500" />
									<div>
										<p className="text-muted-foreground text-xs">Testcases Passed</p>
										<p className="text-foreground font-bold text-sm">
											{submissionResult ? `${submissionResult.passed_testcases} / ${submissionResult.total_testcases}` : '--'}
										</p>
									</div>
								</div>
							</Card>
						</div>

						{submissionResult?.error_message && (
							<div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl font-mono text-xs text-rose-300 whitespace-pre-wrap">
								{submissionResult.error_message}
							</div>
						)}

						<div className="flex gap-3 pt-2">
							<Button
								className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
								onClick={() => {
									setShowSubmitDialog(false);
									navigate('/problems');
								}}
							>
								Problem List
							</Button>
							<Button
								variant="outline"
								className="flex-1 rounded-xl border-border"
								onClick={() => setShowSubmitDialog(false)}
							>
								Continue Editing
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}