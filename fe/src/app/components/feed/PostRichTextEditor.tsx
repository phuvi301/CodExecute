import React, { useRef, useEffect, useState } from 'react';
import {
	Bold,
	Italic,
	Heading1,
	Heading2,
	List,
	ListOrdered,
	Quote,
	Code,
	Strikethrough,
	Smile,
	Sparkles,
	Code2,
	Trophy,
	Zap,
} from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Button } from '../ui/button';

interface PostRichTextEditorProps {
	value: string;
	onChange: (newValue: string) => void;
	placeholder?: string;
}

const EMOJI_CATEGORIES = [
	{
		id: 'popular',
		name: 'Popular',
		icon: Smile,
		emojis: ['🔥', '🚀', '💡', '💯', '✨', '❤️', '👍', '👏', '🎉', '😎', '🤔', '🥳', '🙌', '🙏', '💥', '📌', '⭐', '⚡'],
	},
	{
		id: 'tech',
		name: 'Dev & Tech',
		icon: Code2,
		emojis: ['💻', '⌨️', '🖥️', '⚙️', '⚡', '🐛', '🐞', '🔒', '📦', '🌐', '📊', '🤖', '📱', '🔧', '📡', '🛡️', '🔑', '💎'],
	},
	{
		id: 'achieve',
		name: 'Milestone',
		icon: Trophy,
		emojis: ['🏆', '🥇', '🥈', '🥉', '🎯', '🏷️', '📢', '💬', '📝', '🏅', '🎁', '🎓', '🚩', '🌟'],
	},
	{
		id: 'symbols',
		name: 'Status',
		icon: Zap,
		emojis: ['✅', '❌', '⚠️', 'ℹ️', '🔔', '🔍', '⏳', '📌', '🚀', '⚡', '🎨', '🎯', '🚨', '🟢', '🔴', '🟡'],
	},
];

export const PostRichTextEditor: React.FC<PostRichTextEditorProps> = ({
	value,
	onChange,
	placeholder = 'Share code snippet, ask an algorithm question, or post a coding milestone...',
}) => {
	const editorRef = useRef<HTMLDivElement>(null);
	const [activeCategory, setActiveCategory] = useState('popular');
	const [isEmojiOpen, setIsEmojiOpen] = useState(false);
	const [isEmpty, setIsEmpty] = useState(!value || value === '<br>' || value === '<p></p>');

	const [activeStates, setActiveStates] = useState({
		bold: false,
		italic: false,
		strikethrough: false,
		h1: false,
		h2: false,
		bullet: false,
		numeric: false,
		quote: false,
		code: false,
	});

	const updateActiveStates = () => {
		if (!editorRef.current) return;

		try {
			const isBold = document.queryCommandState('bold');
			const isItalic = document.queryCommandState('italic');
			const isStrikethrough = document.queryCommandState('strikeThrough');
			const isBullet = document.queryCommandState('insertUnorderedList');
			const isNumeric = document.queryCommandState('insertOrderedList');

			let isH1 = false;
			let isH2 = false;
			let isQuote = false;
			let isCode = false;

			const selection = window.getSelection();
			if (selection && selection.rangeCount > 0) {
				let node: Node | null = selection.getRangeAt(0).commonAncestorContainer;
				if (node.nodeType === Node.TEXT_NODE) {
					node = node.parentElement;
				}
				let curr = node as HTMLElement | null;
				while (curr && curr !== editorRef.current) {
					const tag = curr.tagName?.toUpperCase();
					if (tag === 'H1') isH1 = true;
					if (tag === 'H2') isH2 = true;
					if (tag === 'BLOCKQUOTE') isQuote = true;
					if (tag === 'PRE' || tag === 'CODE') isCode = true;
					curr = curr.parentElement;
				}
			}

			setActiveStates({
				bold: isBold,
				italic: isItalic,
				strikethrough: isStrikethrough,
				h1: isH1,
				h2: isH2,
				bullet: isBullet,
				numeric: isNumeric,
				quote: isQuote,
				code: isCode,
			});
		} catch (err) {
			// ignore selection outside editor
		}
	};

	// Track selection change to update active state lights
	useEffect(() => {
		const handleSelectionChange = () => {
			if (document.activeElement === editorRef.current || editorRef.current?.contains(document.activeElement)) {
				updateActiveStates();
			}
		};

		document.addEventListener('selectionchange', handleSelectionChange);
		return () => {
			document.removeEventListener('selectionchange', handleSelectionChange);
		};
	}, []);

	// Sync initial value or external reset to innerHTML
	useEffect(() => {
		if (editorRef.current) {
			const currentHtml = editorRef.current.innerHTML;
			if (value !== currentHtml && (value === '' || value !== currentHtml)) {
				editorRef.current.innerHTML = value || '';
				checkIsEmpty();
			}
		}
	}, [value]);

	const checkIsEmpty = () => {
		if (!editorRef.current) return;
		const text = editorRef.current.innerText.trim();
		const html = editorRef.current.innerHTML.trim();
		const empty = !text && (!html || html === '<br>' || html === '<p></p>' || html === '<p><br></p>');
		setIsEmpty(empty);
	};

	const handleInput = () => {
		if (!editorRef.current) return;
		const html = editorRef.current.innerHTML;
		checkIsEmpty();
		updateActiveStates();
		onChange(html);
	};

	const exec = (command: string, val: string | undefined = undefined) => {
		if (!editorRef.current) return;
		editorRef.current.focus();
		document.execCommand(command, false, val);
		handleInput();
		setTimeout(updateActiveStates, 0);
	};

	const handleFormatBlock = (tag: string) => {
		if (!editorRef.current) return;
		editorRef.current.focus();
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return;

		let parent = selection.getRangeAt(0).commonAncestorContainer as HTMLElement;
		if (parent.nodeType === Node.TEXT_NODE) {
			parent = parent.parentElement as HTMLElement;
		}

		const currentTag = parent.tagName?.toLowerCase();

		if (currentTag === tag.toLowerCase()) {
			document.execCommand('formatBlock', false, 'p');
		} else {
			document.execCommand('formatBlock', false, tag);
		}
		handleInput();
		setTimeout(updateActiveStates, 0);
	};

	const handleInsertEmoji = (emoji: string) => {
		if (!editorRef.current) return;
		editorRef.current.focus();
		document.execCommand('insertText', false, emoji);
		handleInput();
		setIsEmojiOpen(false);
		setTimeout(updateActiveStates, 0);
	};

	const getBtnClass = (isActive: boolean) =>
		`h-8 w-8 p-0 rounded-lg transition-all cursor-pointer ${
			isActive
				? 'bg-primary text-primary-foreground font-bold shadow-xs'
				: 'text-muted-foreground hover:text-foreground hover:bg-accent'
		}`;

	const getHeaderBtnClass = (isActive: boolean) =>
		`h-8 w-8 p-0 rounded-lg transition-all cursor-pointer font-bold text-xs ${
			isActive
				? 'bg-primary text-primary-foreground shadow-xs'
				: 'text-muted-foreground hover:text-primary hover:bg-primary/10'
		}`;

	const currentEmojis = EMOJI_CATEGORIES.find((c) => c.id === activeCategory)?.emojis || [];

	return (
		<div className="rounded-xl border border-border bg-background overflow-hidden flex flex-col focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/40 transition-all">
			{/* WYSIWYG Toolbar */}
			<div className="flex flex-wrap items-center gap-1 p-1.5 bg-card/80 border-b border-border/70 select-none">
				{/* Format Group: Text Style */}
				<div className="flex items-center gap-0.5 border-r border-border/60 pr-1.5 mr-0.5">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onMouseDown={(e) => {
							e.preventDefault();
							exec('bold');
						}}
						className={getBtnClass(activeStates.bold)}
					>
						<Bold className="w-4 h-4" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onMouseDown={(e) => {
							e.preventDefault();
							exec('italic');
						}}
						className={getBtnClass(activeStates.italic)}
					>
						<Italic className="w-4 h-4" />
					</Button>
				</div>

				{/* Format Group: Headings */}
				<div className="flex items-center gap-0.5 border-r border-border/60 pr-1.5 mr-0.5">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onMouseDown={(e) => {
							e.preventDefault();
							handleFormatBlock('h1');
						}}
						className={getHeaderBtnClass(activeStates.h1)}
					>
						<Heading1 className="w-4 h-4" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onMouseDown={(e) => {
							e.preventDefault();
							handleFormatBlock('h2');
						}}
						title="Tiêu đề H2"
						className={getHeaderBtnClass(activeStates.h2)}
					>
						<Heading2 className="w-4 h-4" />
					</Button>
				</div>

				{/* Format Group: Lists & Quotes */}
				<div className="flex items-center gap-0.5 border-r border-border/60 pr-1.5 mr-0.5">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onMouseDown={(e) => {
							e.preventDefault();
							exec('insertUnorderedList');
						}}
						className={getBtnClass(activeStates.bullet)}
					>
						<List className="w-4 h-4" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onMouseDown={(e) => {
							e.preventDefault();
							exec('insertOrderedList');
						}}
						className={getBtnClass(activeStates.numeric)}
					>
						<ListOrdered className="w-4 h-4" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onMouseDown={(e) => {
							e.preventDefault();
							handleFormatBlock('blockquote');
						}}
						className={getBtnClass(activeStates.quote)}
					>
						<Quote className="w-4 h-4" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onMouseDown={(e) => {
							e.preventDefault();
							handleFormatBlock('pre');
						}}
						className={getBtnClass(activeStates.code)}
					>
						<Code className="w-4 h-4" />
					</Button>
				</div>

				{/* Emoji & Icon Picker Popover */}
				<div className="flex items-center ml-auto">
					<Popover open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
						<PopoverTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-8 px-2.5 rounded-lg text-xs font-semibold text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 gap-1.5 cursor-pointer transition-colors"
							>
								<Smile className="w-4 h-4 text-blue-500" />
							</Button>
						</PopoverTrigger>
						<PopoverContent
							align="end"
							sideOffset={8}
							className="w-72 p-3 rounded-2xl border-border bg-card shadow-2xl z-50 space-y-3"
						>
							{/* Category Bar */}
							<div className="flex items-center justify-between border-b border-border/60 pb-2">
								<div className="flex items-center gap-1">
									{EMOJI_CATEGORIES.map((cat) => {
										const IconComp = cat.icon;
										const isActive = activeCategory === cat.id;
										return (
											<button
												key={cat.id}
												type="button"
												onClick={() => setActiveCategory(cat.id)}
												title={cat.name}
												className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
													isActive
														? 'bg-primary/15 text-primary'
														: 'text-muted-foreground hover:text-foreground hover:bg-muted'
												}`}
											>
												<IconComp className="w-3.5 h-3.5" />
											</button>
										);
									})}
								</div>
							</div>

							{/* Emoji Grid */}
							<div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto p-1">
								{currentEmojis.map((emoji, idx) => (
									<button
										key={idx}
										type="button"
										onMouseDown={(e) => {
											e.preventDefault();
											handleInsertEmoji(emoji);
										}}
										className="h-9 w-9 flex items-center justify-center text-lg rounded-xl hover:bg-accent hover:scale-115 transition-all cursor-pointer select-none"
									>
										{emoji}
									</button>
								))}
							</div>
						</PopoverContent>
					</Popover>
				</div>
			</div>

			{/* WYSIWYG Live ContentEditable Body */}
			<div className="relative flex-1 p-3 min-h-[140px] max-h-[300px] overflow-y-auto">
				{isEmpty && (
					<div className="absolute top-3 left-3 right-3 pointer-events-none text-sm text-muted-foreground select-none">
						{placeholder}
					</div>
				)}
				<div
					ref={editorRef}
					contentEditable
					suppressContentEditableWarning
					onInput={handleInput}
					onBlur={handleInput}
					onKeyUp={updateActiveStates}
					onMouseUp={updateActiveStates}
					className="w-full h-full min-h-[120px] focus:outline-none text-foreground text-sm leading-relaxed antialiased prose-editor"
				/>
			</div>

			{/* Scoped CSS styling for live contenteditable elements */}
			<style>{`
				.prose-editor h1 {
					font-size: 1.25rem;
					font-weight: 800;
					margin-top: 0.5rem;
					margin-bottom: 0.5rem;
					line-height: 1.4;
				}
				.prose-editor h2 {
					font-size: 1.125rem;
					font-weight: 700;
					margin-top: 0.375rem;
					margin-bottom: 0.375rem;
					line-height: 1.4;
				}
				.prose-editor blockquote {
					border-left: 4px solid var(--primary, #3b82f6);
					background-color: rgba(59, 130, 246, 0.08);
					padding: 0.375rem 0.75rem;
					margin: 0.5rem 0;
					border-radius: 0 0.5rem 0.5rem 0;
					font-style: italic;
					color: var(--muted-foreground, #9ca3af);
				}
				.prose-editor ul {
					list-style-type: disc;
					padding-left: 1.25rem;
					margin: 0.375rem 0;
				}
				.prose-editor ol {
					list-style-type: decimal;
					padding-left: 1.25rem;
					margin: 0.375rem 0;
				}
				.prose-editor pre {
					background-color: rgba(0, 0, 0, 0.3);
					border: 1px solid rgba(255, 255, 255, 0.1);
					padding: 0.5rem;
					border-radius: 0.5rem;
					font-family: monospace;
					font-size: 0.8125rem;
					margin: 0.5rem 0;
					overflow-x: auto;
				}
				.prose-editor code {
					background-color: rgba(255, 255, 255, 0.1);
					padding: 0.125rem 0.375rem;
					border-radius: 0.25rem;
					font-family: monospace;
					font-size: 0.8125rem;
				}
			`}</style>
		</div>
	);
};
