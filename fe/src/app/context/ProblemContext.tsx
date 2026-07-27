import React, { createContext, useContext, useState } from 'react';

export interface Problem {
	id: string;
	title: string;
	difficulty: 'Easy' | 'Medium' | 'Hard';
	acceptance: string;
	submissions: string;
	description: string;
	examples: {
		input: string;
		output: string;
		explanation?: string;
	}[];
	constraints: string[];
}

export const PROBLEMS_LIST: Problem[] = [
	{
		id: '1',
		title: 'Two Sum',
		difficulty: 'Easy',
		acceptance: '48.2%',
		submissions: '2.3M',
		description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
		examples: [
			{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
			{ input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: '' },
			{ input: 'nums = [3,3], target = 6', output: '[0,1]', explanation: '' }
		],
		constraints: ['2 <= nums.length <= 10⁴', '-10⁹ <= nums[i] <= 10⁹', '-10⁹ <= target <= 10⁹', 'Only one valid answer exists.']
	},
	{
		id: '2',
		title: 'Add Two Numbers',
		difficulty: 'Medium',
		acceptance: '41.5%',
		submissions: '1.8M',
		description: `You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.`,
		examples: [
			{ input: 'l1 = [2,4,3], l2 = [5,6,4]', output: '[7,0,8]', explanation: '342 + 465 = 807.' }
		],
		constraints: ['The number of nodes in each linked list is in the range [1, 100]', '0 <= Node.val <= 9']
	},
	{
		id: '3',
		title: 'Longest Substring Without Repeating Characters',
		difficulty: 'Medium',
		acceptance: '34.8%',
		submissions: '3.1M',
		description: `Given a string s, find the length of the longest substring without repeating characters.`,
		examples: [
			{ input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' }
		],
		constraints: ['0 <= s.length <= 5 * 10⁴', 's consists of English letters, digits, symbols and spaces.']
	},
	{
		id: '4',
		title: 'Median of Two Sorted Arrays',
		difficulty: 'Hard',
		acceptance: '37.1%',
		submissions: '1.2M',
		description: `Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).`,
		examples: [
			{ input: 'nums1 = [1,3], nums2 = [2]', output: '2.00000', explanation: 'merged array = [1,2,3] and median is 2.' }
		],
		constraints: ['nums1.length == m', 'nums2.length == n', '0 <= m <= 1000', '0 <= n <= 1000']
	}
];

export const CODE_TEMPLATES: Record<string, string> = {
	javascript: `function twoSum(nums, target) {
    // Write your solution here
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) {
            return [map.get(diff), i];
        }
        map.set(nums[i], i);
    }
    return [];
}`,
	python: `def twoSum(nums: list[int], target: int) -> list[int]:
    # Write your solution here
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []`,
	cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your solution here
        unordered_map<int, int> mp;
        for (int i = 0; i < nums.size(); i++) {
            int diff = target - nums[i];
            if (mp.find(diff) != mp.end()) {
                return {mp[diff], i};
            }
            mp[nums[i]] = i;
        }
        return {};
    }
};`,
	java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int diff = target - nums[i];
            if (map.containsKey(diff)) {
                return new int[] { map.get(diff), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }
}`,
	typescript: `function twoSum(nums: number[], target: number): number[] {
    // Write your solution here
    const map = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) {
            return [map.get(diff)!, i];
        }
        map.set(nums[i], i);
    }
    return [];
}`
};

interface ProblemContextType {
	currentProblemId: string;
	setCurrentProblemId: (id: string) => void;
	problem: Problem;
	language: string;
	setLanguage: (lang: string) => void;
	code: string;
	setCode: (code: string) => void;
	isRunning: boolean;
	runCode: () => void;
	submitCode: () => void;
	showSubmitDialog: boolean;
	setShowSubmitDialog: (show: boolean) => void;
	testOutput: string | null;
	activeTab: string;
	setActiveTab: (tab: string) => void;
}

const ProblemContext = createContext<ProblemContextType | undefined>(undefined);

export function ProblemProvider({ children }: { children: React.ReactNode }) {
	const [currentProblemId, setCurrentProblemId] = useState<string>('1');
	const [language, setLanguageState] = useState<string>('javascript');
	const [code, setCode] = useState<string>(CODE_TEMPLATES['javascript']);
	const [isRunning, setIsRunning] = useState<boolean>(false);
	const [showSubmitDialog, setShowSubmitDialog] = useState<boolean>(false);
	const [testOutput, setTestOutput] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<string>('testcase');

	const problem = PROBLEMS_LIST.find((p) => p.id === currentProblemId) || PROBLEMS_LIST[0];

	const setLanguage = (lang: string) => {
		setLanguageState(lang);
		if (CODE_TEMPLATES[lang]) {
			setCode(CODE_TEMPLATES[lang]);
		}
	};

	const runCode = () => {
		setIsRunning(true);
		setTestOutput(null);
		setActiveTab('result');
		setTimeout(() => {
			setIsRunning(false);
			setTestOutput('Status: Accepted\nRuntime: 52 ms\nMemory: 42.1 MB\n\nOutput: [0, 1]\nExpected: [0, 1]');
		}, 800);
	};

	const submitCode = () => {
		setShowSubmitDialog(true);
	};

	return (
		<ProblemContext.Provider
			value={{
				currentProblemId,
				setCurrentProblemId,
				problem,
				language,
				setLanguage,
				code,
				setCode,
				isRunning,
				runCode,
				submitCode,
				showSubmitDialog,
				setShowSubmitDialog,
				testOutput,
				activeTab,
				setActiveTab,
			}}
		>
			{children}
		</ProblemContext.Provider>
	);
}

export function useProblem() {
	const context = useContext(ProblemContext);
	if (!context) {
		// Return safe fallback if used outside ProblemProvider
		return {
			currentProblemId: '1',
			setCurrentProblemId: () => {},
			problem: PROBLEMS_LIST[0],
			language: 'javascript',
			setLanguage: () => {},
			code: CODE_TEMPLATES['javascript'],
			setCode: () => {},
			isRunning: false,
			runCode: () => {},
			submitCode: () => {},
			showSubmitDialog: false,
			setShowSubmitDialog: () => {},
			testOutput: null,
			activeTab: 'testcase',
			setActiveTab: () => {},
		};
	}
	return context;
}
