import React from 'react';

interface FormattedPostContentProps {
	content: string;
	className?: string;
}

export const FormattedPostContent: React.FC<FormattedPostContentProps> = ({
	content,
	className = '',
}) => {
	if (!content) return null;

	// Detect if content contains HTML tags (from WYSIWYG editor)
	const isHtml = /<[a-z][\s\S]*>/i.test(content);

	if (isHtml) {
		return (
			<div className={`prose-wrapper ${className}`}>
				<div
					className="prose-rendered text-foreground text-sm leading-relaxed"
					dangerouslySetInnerHTML={{ __html: content }}
				/>
				<style>{`
					.prose-rendered h1 {
						font-size: 1.25rem;
						font-weight: 800;
						margin-top: 0.75rem;
						margin-bottom: 0.5rem;
						line-height: 1.4;
						color: var(--foreground);
					}
					.prose-rendered h2 {
						font-size: 1.125rem;
						font-weight: 700;
						margin-top: 0.5rem;
						margin-bottom: 0.375rem;
						line-height: 1.4;
						color: var(--foreground);
					}
					.prose-rendered h3 {
						font-size: 1rem;
						font-weight: 700;
						margin-top: 0.5rem;
						margin-bottom: 0.25rem;
						line-height: 1.4;
						color: var(--foreground);
					}
					.prose-rendered p {
						margin-bottom: 0.5rem;
					}
					.prose-rendered p:last-child {
						margin-bottom: 0;
					}
					.prose-rendered b, .prose-rendered strong {
						font-weight: 700;
						color: var(--foreground);
					}
					.prose-rendered i, .prose-rendered em {
						font-style: italic;
					}
					.prose-rendered strike, .prose-rendered s, .prose-rendered del {
						text-decoration: line-through;
						opacity: 0.75;
					}
					.prose-rendered blockquote {
						border-left: 4px solid var(--primary, #3b82f6);
						background-color: rgba(59, 130, 246, 0.08);
						padding: 0.5rem 0.875rem;
						margin: 0.5rem 0;
						border-radius: 0 0.5rem 0.5rem 0;
						font-style: italic;
						color: var(--muted-foreground, #9ca3af);
					}
					.prose-rendered ul {
						list-style-type: disc;
						padding-left: 1.5rem;
						margin: 0.5rem 0;
					}
					.prose-rendered ul li {
						margin: 0.25rem 0;
					}
					.prose-rendered ol {
						list-style-type: decimal;
						padding-left: 1.5rem;
						margin: 0.5rem 0;
					}
					.prose-rendered ol li {
						margin: 0.25rem 0;
					}
					.prose-rendered pre {
						background-color: rgba(0, 0, 0, 0.4);
						border: 1px solid rgba(255, 255, 255, 0.1);
						padding: 0.625rem 0.875rem;
						border-radius: 0.5rem;
						font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
						font-size: 0.8125rem;
						margin: 0.5rem 0;
						overflow-x: auto;
						color: #e5e7eb;
					}
					.prose-rendered code {
						background-color: rgba(255, 255, 255, 0.1);
						padding: 0.125rem 0.375rem;
						border-radius: 0.25rem;
						font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
						font-size: 0.8125rem;
						color: var(--primary, #3b82f6);
					}
					.prose-rendered a {
						color: var(--primary, #3b82f6);
						text-decoration: underline;
					}
					.prose-rendered img {
						max-width: 100%;
						height: auto;
						border-radius: 0.5rem;
						margin: 0.5rem 0;
					}
				`}</style>
			</div>
		);
	}

	const renderInline = (text: string): React.ReactNode[] => {
		const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|`[^`]+`)/g;
		const parts = text.split(regex);

		return parts.map((part, index) => {
			if (part.startsWith('**') && part.endsWith('**')) {
				return (
					<strong key={index} className="font-bold text-foreground">
						{part.slice(2, -2)}
					</strong>
				);
			}
			if (part.startsWith('*') && part.endsWith('*')) {
				return (
					<em key={index} className="italic text-foreground/90">
						{part.slice(1, -1)}
					</em>
				);
			}
			if (part.startsWith('~~') && part.endsWith('~~')) {
				return (
					<del key={index} className="line-through text-muted-foreground">
						{part.slice(2, -2)}
					</del>
				);
			}
			if (part.startsWith('`') && part.endsWith('`')) {
				return (
					<code
						key={index}
						className="px-1.5 py-0.5 mx-0.5 rounded-md bg-muted text-primary text-xs font-mono font-semibold border border-border/40 shadow-2xs"
					>
						{part.slice(1, -1)}
					</code>
				);
			}
			return part;
		});
	};

	const lines = content.split('\n');

	return (
		<div className={`space-y-1.5 text-foreground text-sm leading-relaxed ${className}`}>
			{lines.map((line, idx) => {
				const trimmed = line.trim();

				if (trimmed.startsWith('# ')) {
					return (
						<h1
							key={idx}
							className="text-xl font-extrabold text-foreground mt-3 mb-2 tracking-tight"
						>
							{renderInline(trimmed.substring(2))}
						</h1>
					);
				}

				if (trimmed.startsWith('## ')) {
					return (
						<h2
							key={idx}
							className="text-lg font-bold text-foreground mt-2.5 mb-1.5 tracking-tight"
						>
							{renderInline(trimmed.substring(3))}
						</h2>
					);
				}

				if (trimmed.startsWith('### ')) {
					return (
						<h3
							key={idx}
							className="text-base font-bold text-foreground mt-2 mb-1 tracking-tight"
						>
							{renderInline(trimmed.substring(4))}
						</h3>
					);
				}

				if (trimmed.startsWith('> ')) {
					return (
						<blockquote
							key={idx}
							className="border-l-4 border-primary/70 bg-primary/5 px-3.5 py-2 rounded-r-xl my-2 text-muted-foreground italic font-normal"
						>
							{renderInline(trimmed.substring(2))}
						</blockquote>
					);
				}

				if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
					return (
						<div key={idx} className="flex items-start gap-2 my-1 pl-1 text-foreground">
							<span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
							<span className="flex-1">{renderInline(trimmed.substring(2))}</span>
						</div>
					);
				}

				const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
				if (numMatch) {
					return (
						<div key={idx} className="flex items-start gap-2 my-1 pl-1 text-foreground">
							<span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md shrink-0 font-mono">
								{numMatch[1]}.
							</span>
							<span className="flex-1">{renderInline(numMatch[2])}</span>
						</div>
					);
				}

				if (trimmed === '') {
					return <div key={idx} className="h-1" />;
				}

				return <p key={idx}>{renderInline(line)}</p>;
			})}
		</div>
	);
};
