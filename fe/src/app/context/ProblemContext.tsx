import React, { createContext, useContext, useState } from 'react';
import { runCodeApi, submitCodeApi, getSubmissionResultApi, RunCodeResponse, SubmissionResponseData } from '../services/api';

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
    
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            print(f"{seen[diff]} {i}")
            return
        seen[num] = i

if __name__ == "__main__":
    solve()`,
	javascript: `const fs = require('fs');

function solve() {
    const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
    if (lines.length < 2) return;
    const nums = lines[0].trim().split(/\\s+/).map(Number);
    const target = Number(lines[1].trim());

    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) {
            console.log(\`\${map.get(diff)} \${i}\`);
            return;
        }
        map.set(nums[i], i);
    }
}

solve();`,
	cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
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

    unordered_map<int, int> mp;
    for (int i = 0; i < nums.size(); i++) {
        int diff = target - nums[i];
        if (mp.find(diff) != mp.end()) {
            cout << mp[diff] << " " << i << endl;
            return 0;
        }
        mp[nums[i]] = i;
    }
    return 0;
}`,
	java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String[] parts = sc.nextLine().trim().split("\\\\s+");
        int target = sc.nextInt();

        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < parts.length; i++) {
            int num = Integer.parseInt(parts[i]);
            int diff = target - num;
            if (map.containsKey(diff)) {
                System.out.println(map.get(diff) + " " + i);
                return;
            }
            map.put(num, i);
        }
    }
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
	const [code, setCode] = useState<string>(CODE_TEMPLATES['python']);
	const [isRunning, setIsRunning] = useState<boolean>(false);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [showSubmitDialog, setShowSubmitDialog] = useState<boolean>(false);
	const [testOutput, setTestOutput] = useState<string | null>(null);
	const [runResult, setRunResult] = useState<RunCodeResponse | null>(null);
	const [submissionResult, setSubmissionResult] = useState<SubmissionResponseData | null>(null);
	const [activeTab, setActiveTab] = useState<string>('testcase');

	const problem = PROBLEMS_LIST.find((p) => p.id === currentProblemId) || PROBLEMS_LIST[0];

	const setLanguage = (lang: string) => {
		setLanguageState(lang);
		if (CODE_TEMPLATES[lang]) {
			setCode(CODE_TEMPLATES[lang]);
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
			setTestOutput(`Lỗi thực thi Run Code:\n${error.message || error}`);
		} finally {
			setIsRunning(false);
		}
	};

	// NÚT SUBMIT CODE: Nộp bài, LƯU DYNAMODB (Status: Pending, Code content), PUSH SQS
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

			// Poll kết quả cho đến khi hoàn thành chấm bài
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
				error_message: error.message || 'Lỗi nộp bài',
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
				problem,
				language,
				setLanguage,
				code,
				setCode,
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
			problem: PROBLEMS_LIST[0],
			language: 'python',
			setLanguage: () => {},
			code: CODE_TEMPLATES['python'],
			setCode: () => {},
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
