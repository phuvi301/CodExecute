import { useEffect, useState } from 'react';
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
	Sparkles
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../ui/resizable';
import { useIsMobile } from '../ui/use-mobile';
import { useNavigate } from 'react-router-dom';
import { useProblem } from '../../context/ProblemContext';
import { useTheme } from '../shared/ThemeProvider';

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

	useEffect(() => {
		if (problemId) {
			setCurrentProblemId(problemId);
		}
	}, [problemId, setCurrentProblemId]);

	const filename = EXTENSIONS[language] || 'solution.js';
	const monacoLang = MONACO_LANGUAGES[language] || 'javascript';

	const handleEditorDidMount: OnMount = (editor) => {
		editor.onDidChangeCursorPosition((e) => {
			setCursorPos({
				line: e.position.lineNumber,
				column: e.position.column,
			});
		});

		// Add keyboard shortcut: Ctrl+Enter to Run, Ctrl+Shift+Enter to Submit
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
				{/* LEFT PANE: Problem Description, Examples, Submissions, Discussions */}
				<ResizablePanel
					defaultSize={isMobile ? 40 : 45}
					minSize={20}
					maxSize={80}
					className="h-full overflow-y-auto bg-card/20 flex flex-col"
				>
					<div className="p-4 sm:p-6 flex-1">
						<Tabs defaultValue="description" className="w-full">
							<TabsList className="mb-6 bg-muted/60 p-1 rounded-xl">
								<TabsTrigger value="description" className="rounded-lg text-xs font-semibold px-4 py-1.5">
									Description
								</TabsTrigger>
								<TabsTrigger value="solutions" className="rounded-lg text-xs font-semibold px-4 py-1.5">
									Solutions
								</TabsTrigger>
								<TabsTrigger value="discussions" className="rounded-lg text-xs font-semibold px-4 py-1.5">
									Discussions
								</TabsTrigger>
							</TabsList>

							{/* Description Content */}
							<TabsContent value="description" className="space-y-6">
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

							<TabsContent value="solutions">
								<div className="p-6 rounded-xl bg-muted/20 border border-border text-center text-muted-foreground text-sm space-y-2">
									<Code2 className="w-10 h-10 mx-auto text-primary opacity-80" />
									<p className="font-medium text-foreground">Official Solutions Locked</p>
									<p className="text-xs text-muted-foreground">Solutions will unlock after your first successful submission.</p>
								</div>
							</TabsContent>

							<TabsContent value="discussions">
								<div className="space-y-3">
									<Card className="p-4 border-border/80 hover:border-primary/50 transition-all cursor-pointer rounded-xl">
										<div className="flex items-start gap-3 mb-2">
											<MessageCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
											<div className="flex-1">
												<h4 className="text-foreground font-semibold text-sm mb-1">
													Optimal Hash Map O(n) Approach
												</h4>
												<p className="text-muted-foreground text-xs line-clamp-2">
													Detailed walkthrough using single-pass hash table with O(n) time and O(n) space complexity...
												</p>
											</div>
										</div>
										<div className="flex items-center gap-3 text-muted-foreground text-xs pt-2 border-t border-border/40">
											<span>45 replies</span>
											<span>•</span>
											<span>2 hours ago</span>
										</div>
									</Card>
								</div>
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

									<div className="bg-[#1e1e1e] rounded-xl p-3 border border-gray-800 space-y-2">
										<p className="text-gray-400 text-xs font-mono">Input:</p>
										<div className="bg-[#252526] p-2.5 rounded-lg border border-gray-700/60 font-mono text-xs text-gray-200 overflow-x-auto">
											{problem.examples[selectedTestCase]?.input || 'nums = [2,7,11,15], target = 9'}
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