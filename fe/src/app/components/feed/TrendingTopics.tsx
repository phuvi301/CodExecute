import { useMemo } from 'react';
import { Sparkles, Hash } from 'lucide-react';
import { Card } from '../ui/card';
import { PostItem } from '../../services/api';

interface TrendingTopicsProps {
	className?: string;
	posts?: PostItem[];
	selectedTopic?: string | null;
	onTopicClick?: (topic: string) => void;
}

export const DEFAULT_TRENDING_TOPICS = [
	'#DynamicProgramming',
	'#GraphTheory',
	'#BinarySearch',
	'#SystemDesign',
	'#TwoPointers',
	'#Recursion',
	'#Python'
];

export function TrendingTopics({ className = '', posts = [], selectedTopic, onTopicClick }: TrendingTopicsProps) {
	// Extract dynamic topics from post tags and hashtags in post contents
	const trendingTopics = useMemo(() => {
		if (!posts || posts.length === 0) {
			return DEFAULT_TRENDING_TOPICS.map(tag => ({ tag, count: 1 }));
		}

		const frequencyMap: Record<string, { displayTag: string; count: number }> = {};

		posts.forEach((post) => {
			// 1. Process explicit tags array (e.g. ['Discussion', 'CodeShare'])
			if (Array.isArray(post.tags)) {
				post.tags.forEach((t) => {
					if (!t) return;
					const clean = t.trim().replace(/^#/, '');
					if (clean) {
						const lowerKey = clean.toLowerCase();
						const displayTag = `#${clean}`;
						if (!frequencyMap[lowerKey]) {
							frequencyMap[lowerKey] = { displayTag, count: 0 };
						}
						frequencyMap[lowerKey].count += 1;
					}
				});
			}

			// 2. Extract hashtags from post content body (e.g. #BinarySearch)
			if (post.content) {
				const hashtagMatches = post.content.match(/#([a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]+)/g);
				if (hashtagMatches) {
					hashtagMatches.forEach((match) => {
						const clean = match.trim().replace(/^#/, '');
						if (clean) {
							const lowerKey = clean.toLowerCase();
							const displayTag = `#${clean}`;
							if (!frequencyMap[lowerKey]) {
								frequencyMap[lowerKey] = { displayTag, count: 0 };
							}
							frequencyMap[lowerKey].count += 1;
						}
					});
				}
			}
		});

		const sortedExtracted = Object.values(frequencyMap)
			.sort((a, b) => b.count - a.count)
			.map(item => ({ tag: item.displayTag, count: item.count }));

		// If no tags extracted from feed posts yet, return defaults
		if (sortedExtracted.length === 0) {
			return DEFAULT_TRENDING_TOPICS.map(tag => ({ tag, count: 1 }));
		}

		return sortedExtracted;
	}, [posts]);

	return (
		<Card className={`p-6 bg-card/60 backdrop-blur-xl border border-border/80 rounded-3xl shadow-sm space-y-4 ${className}`}>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2.5">
					<div className="p-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
						<Sparkles className="w-4 h-4 text-primary animate-pulse" />
					</div>
					<h3 className="text-base font-bold tracking-tight text-foreground">
						Trending Topics
					</h3>
				</div>
			</div>

			<div className="flex flex-wrap gap-2 pt-1">
				{trendingTopics.map(({ tag }) => {
					const isSelected = selectedTopic && selectedTopic.toLowerCase().replace(/^#/, '') === tag.toLowerCase().replace(/^#/, '');

					return (
						<button
							key={tag}
							type="button"
							onClick={() => onTopicClick && onTopicClick(tag)}
							className={`px-3.5 py-1.5 rounded-2xl text-xs font-mono font-medium transition-all duration-200 cursor-pointer shadow-sm flex items-center gap-1.5 hover:scale-105 active:scale-95 ${
								isSelected
									? 'bg-primary text-primary-foreground border-primary font-bold ring-2 ring-primary/30 shadow-md'
									: 'bg-[#182232]/80 dark:bg-[#182232] text-slate-300 hover:text-primary-foreground hover:bg-primary border border-slate-700/50 hover:border-primary/50'
							}`}
						>
							<Hash className="w-3 h-3 opacity-70" />
							<span>{tag.replace(/^#/, '')}</span>
						</button>
					);
				})}
			</div>
		</Card>
	);
}
