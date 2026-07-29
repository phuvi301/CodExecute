import React, { createContext, useContext, useState, useEffect } from 'react';
import { runCodeApi, submitCodeApi, getSubmissionResultApi, getProblemDetailApi, getProblemsApi, RunCodeResponse, SubmissionResponseData } from '../services/api';

export interface Problem {
	id: string;
	title: string;
	difficulty: 'Easy' | 'Medium' | 'Hard';
	acceptance: string;
	submissions: string;
	likes_count?: number;
	dislikes_count?: number;
	liked_by?: string[];
	disliked_by?: string[];
	description: string;
	examples: {
		input: string;
		output: string;
		explanation?: string;
	}[];
	constraints: string[];
	init_code?: Record<string, string>;
}

export const PROBLEMS_LIST: Problem[] = [
	{
		id: 'two-sum',
		title: 'Two Sum',
		difficulty: 'Easy',
		acceptance: '48.2%',
		submissions: '2.3M',
		description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

Input format:
- Line 1: Space-separated integers for nums.
- Line 2: Integer target.

Example:
Input:
2 7 11 15
9
Output:
0 1`,
		examples: [
			{ input: '2 7 11 15\n9', output: '0 1', explanation: 'Because nums[0] + nums[1] == 9, we return 0 1.' },
			{ input: '3 2 4\n6', output: '1 2', explanation: '' },
			{ input: '3 3\n6', output: '0 1', explanation: '' }
		],
		constraints: ['2 <= nums.length <= 10⁴', '-10⁹ <= nums[i] <= 10⁹', '-10⁹ <= target <= 10⁹', 'Only one valid answer exists.']
	},
	{
		id: '1',
		title: 'Two Sum (Classic)',
		difficulty: 'Easy',
		acceptance: '48.2%',
		submissions: '2.3M',
		description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.`,
		examples: [
			{ input: '2 7 11 15\n9', output: '0 1', explanation: '' }
		],
		constraints: ['2 <= nums.length <= 10⁴']
	}
];

export const CODE_TEMPLATES: Record<string, string> = {
	python: `import sys

def solve():
    lines = sys.stdin.read().strip().splitlines()
    if len(lines) < 2:
        return
    nums = list(map(int, lines[0].split()))
    target = int(lines[1])
    
    # TODO: Write your solution here
    pass

if __name__ == "__main__":
    solve()`,
	javascript: `const fs = require('fs');

function solve() {
    const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
    if (lines.length < 2) return;
    const nums = lines[0].trim().split(/\\s+/).map(Number);
    const target = parseInt(lines[1]);

    // TODO: Write your solution here

}

solve();`,
	cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> nums;
    int val;
    while (cin >> val) {
        nums.push_back(val);
    }
    if (nums.size() < 2) return 0;
    int target = nums.back();
    nums.pop_back();

    // TODO: Write your solution here

    return 0;
}`,
	java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        ArrayList<Integer> nums = new ArrayList<>();
        while (sc.hasNextInt()) {
            nums.add(sc.nextInt());
        }
        if (nums.size() < 2) return;
        int target = nums.remove(nums.size() - 1);

        // TODO: Write your solution here

    }
}`
};

interface ProblemContextType {
	currentProblemId: string;
	setCurrentProblemId: (id: string) => void;
	problemsList: { id: string; title: string }[];
	problem: Problem;
	language: string;
	setLanguage: (lang: string) => void;
	code: string;
	setCode: (code: string) => void;
	resetCodeToInit: () => void;
	isRunning: boolean;
	isSubmitting: boolean;
	runCode: () => Promise<void>;
	submitCode: () => Promise<void>;
	showSubmitDialog: boolean;
	setShowSubmitDialog: (show: boolean) => void;
	testOutput: string | null;
	submissionResult: SubmissionResponseData | null;
	runResult: RunCodeResponse | null;
	activeTab: string;
	setActiveTab: (tab: string) => void;
}

const ProblemContext = createContext<ProblemContextType | undefined>(undefined);

export function ProblemProvider({ children }: { children: React.ReactNode }) {
	const [currentProblemId, setCurrentProblemId] = useState<string>('two-sum');
	const [language, setLanguageState] = useState<string>('python');
	const [code, setCodeState] = useState<string>('');
	const [isRunning, setIsRunning] = useState<boolean>(false);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [showSubmitDialog, setShowSubmitDialog] = useState<boolean>(false);
	const [testOutput, setTestOutput] = useState<string | null>(null);
	const [runResult, setRunResult] = useState<RunCodeResponse | null>(null);
	const [submissionResult, setSubmissionResult] = useState<SubmissionResponseData | null>(null);
	const [activeTab, setActiveTab] = useState<string>('testcase');

	const [problemsList, setProblemsList] = useState<{ id: string; title: string }[]>([]);
	const [fetchedProblem, setFetchedProblem] = useState<Problem | null>(null);

	useEffect(() => {
		getProblemsApi()
			.then((data) => {
				if (Array.isArray(data) && data.length > 0) {
					const list = data
						.map((p) => ({
							id: p.ProblemID || p.problem_id || p.id || '',
							title: p.Title || p.title || 'Untitled Problem',
						}))
						.filter((p) => Boolean(p.id));
					setProblemsList(list);
				}
			})
			.catch((err) => {
				console.error('Failed to fetch problems list in ProblemContext:', err);
			});
	}, []);

	useEffect(() => {
		let isMounted = true;
		if (!currentProblemId) return;

		setFetchedProblem(null);

		getProblemDetailApi(currentProblemId)
			.then((data) => {
				if (!isMounted || !data) return;
				const rawDiff = data.Difficulty || data.difficulty || 'Easy';
				const formattedDiff = (rawDiff.charAt(0).toUpperCase() + rawDiff.slice(1).toLowerCase()) as 'Easy' | 'Medium' | 'Hard';

				let exList = data.Examples || data.examples || [];
				if ((!exList || exList.length === 0) && data.testcases) {
					exList = data.testcases
						.filter((tc: any) => tc.is_sample || tc.IsSample)
						.map((tc: any) => ({
							input: tc.input || tc.Input || '',
							output: tc.output || tc.Output || '',
							explanation: tc.explanation || tc.Explanation || ''
						}));
				}

				let constraintArr: string[] = [];
				if (typeof data.Constraints === 'string') {
					constraintArr = data.Constraints.split('\n').filter(Boolean);
				} else if (typeof data.constraints === 'string') {
					constraintArr = data.constraints.split('\n').filter(Boolean);
				} else if (Array.isArray(data.constraints)) {
					constraintArr = data.constraints;
				}

				const accRateStr = data.AcceptanceRate ? String(data.AcceptanceRate) : (data.acceptance || '0.0%');
				const totalSubsStr = data.TotalSubmissions !== undefined ? String(data.TotalSubmissions) : (data.submissions ? String(data.submissions) : '0');

				setFetchedProblem({
					id: data.ProblemID || data.problem_id || currentProblemId,
					title: data.Title || data.title || 'Untitled Problem',
					difficulty: formattedDiff,
					acceptance: accRateStr.endsWith('%') ? accRateStr : `${accRateStr}%`,
					submissions: totalSubsStr,
					likes_count: data.LikesCount !== undefined ? data.LikesCount : (data.likes_count || 0),
					dislikes_count: data.DislikesCount !== undefined ? data.DislikesCount : (data.dislikes_count || 0),
					liked_by: data.LikedBy || data.liked_by || [],
					disliked_by: data.DislikedBy || data.disliked_by || [],
					description: data.Description || data.description || '',
					examples: exList,
					constraints: constraintArr,
					init_code: data.InitCode || data.init_code || {},
				});
			})
			.catch((err) => {
				console.error('Failed to fetch problem detail from API:', err);
			});

		return () => {
			isMounted = false;
		};
	}, [currentProblemId]);

	const localFallback = PROBLEMS_LIST.find((p) => p.id === currentProblemId) || PROBLEMS_LIST[0];
	const problem = fetchedProblem || localFallback;

	// Automatically load saved code from localStorage OR fallback to init_code / CODE_TEMPLATES
	useEffect(() => {
		if (!currentProblemId) return;
		const storageKey = `codexecute_code_${currentProblemId}_${language}`;
		const savedCode = localStorage.getItem(storageKey);
		if (savedCode !== null) {
			setCodeState(savedCode);
		} else {
			const initMap = fetchedProblem?.init_code || problem?.init_code;
			if (initMap && initMap[language] && initMap[language].trim()) {
				setCodeState(initMap[language]);
			} else {
				setCodeState(CODE_TEMPLATES[language] || '');
			}
		}
	}, [currentProblemId, language, fetchedProblem]);

	const setCode = (newCode: string) => {
		setCodeState(newCode);
		if (currentProblemId && language) {
			localStorage.setItem(`codexecute_code_${currentProblemId}_${language}`, newCode);
		}
	};

	const setLanguage = (lang: string) => {
		setLanguageState(lang);
		const storageKey = `codexecute_code_${currentProblemId}_${lang}`;
		const savedCode = localStorage.getItem(storageKey);
		if (savedCode !== null) {
			setCodeState(savedCode);
		} else {
			const initMap = fetchedProblem?.init_code || problem?.init_code;
			if (initMap && initMap[lang] && initMap[lang].trim()) {
				setCodeState(initMap[lang]);
			} else {
				setCodeState(CODE_TEMPLATES[lang] || '');
			}
		}
	};

	const resetCodeToInit = () => {
		const initMap = fetchedProblem?.init_code || problem?.init_code;
		const initCode = (initMap && initMap[language] && initMap[language].trim()) ? initMap[language] : (CODE_TEMPLATES[language] || '');
		setCodeState(initCode);
		if (currentProblemId && language) {
			localStorage.setItem(`codexecute_code_${currentProblemId}_${language}`, initCode);
		}
	};

	// NÚT RUN CODE: Chạy 3-5 testcase mẫu, KHÔNG LƯU DATABASE, KHÔNG PUSH SQS
	const runCode = async () => {
		setIsRunning(true);
		setTestOutput(null);
		setRunResult(null);
		setActiveTab('result');

		try {
			const res = await runCodeApi({
				problem_id: currentProblemId,
				language: language,
				code: code
			});

			setRunResult(res);
			const formattedOutput = [
				`Status: ${res.status}`,
				`Testcases Passed: ${res.passed_testcases} / ${res.total_testcases}`,
				`Execution Time: ${res.execution_time}s`,
				`Memory Used: ${res.memory_used} MB`,
				res.error_message ? `\n[Error Details]:\n${res.error_message}` : ''
			].filter(Boolean).join('\n');

			setTestOutput(formattedOutput);
		} catch (error: any) {
			setTestOutput(`Run Code Execution Error:\n${error.message || error}`);
		} finally {
			setIsRunning(false);
		}
	};

	// SUBMIT CODE BUTTON: Submit solution, SAVE TO DYNAMODB (Status: Pending, Code content), PUSH TO SQS
	const submitCode = async () => {
		setIsSubmitting(true);
		setSubmissionResult(null);
		setShowSubmitDialog(true);

		try {
			const pendingSub = await submitCodeApi({
				problem_id: currentProblemId,
				language: language,
				code: code
			});

			setSubmissionResult(pendingSub);

			// Poll for results until execution finishes
			let attempts = 0;
			const maxAttempts = 15;

			const pollInterval = setInterval(async () => {
				attempts++;
				try {
					const latestResult = await getSubmissionResultApi(pendingSub.submission_id);
					setSubmissionResult(latestResult);

					if (latestResult.status !== 'Pending' || attempts >= maxAttempts) {
						clearInterval(pollInterval);
						setIsSubmitting(false);
					}
				} catch (e) {
					clearInterval(pollInterval);
					setIsSubmitting(false);
				}
			}, 1000);

		} catch (error: any) {
			setSubmissionResult({
				submission_id: 'error',
				user_id: '',
				problem_id: currentProblemId,
				language: language,
				code: code,
				status: 'Runtime Error',
				execution_time: 0,
				memory_used: 0,
				passed_testcases: 0,
				total_testcases: 0,
				error_message: error.message || 'Submission Error',
				submitted_at: new Date().toISOString()
			});
			setIsSubmitting(false);
		}
	};

	return (
		<ProblemContext.Provider
			value={{
				currentProblemId,
				setCurrentProblemId,
				problemsList,
				problem,
				language,
				setLanguage,
				code,
				setCode,
				resetCodeToInit,
				isRunning,
				isSubmitting,
				runCode,
				submitCode,
				showSubmitDialog,
				setShowSubmitDialog,
				testOutput,
				submissionResult,
				runResult,
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
		return {
			currentProblemId: 'two-sum',
			setCurrentProblemId: () => {},
			problemsList: PROBLEMS_LIST.map((p) => ({ id: p.id, title: p.title })),
			problem: PROBLEMS_LIST[0],
			language: 'python',
			setLanguage: () => {},
			code: CODE_TEMPLATES['python'],
			setCode: () => {},
			resetCodeToInit: () => {},
			isRunning: false,
			isSubmitting: false,
			runCode: async () => {},
			submitCode: async () => {},
			showSubmitDialog: false,
			setShowSubmitDialog: () => {},
			testOutput: null,
			submissionResult: null,
			runResult: null,
			activeTab: 'testcase',
			setActiveTab: () => {},
		};
	}
	return context;
}
