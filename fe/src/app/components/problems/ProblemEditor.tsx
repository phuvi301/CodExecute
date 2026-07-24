import { useState } from 'react';
import { ArrowLeft, Play, Send, CheckCircle, Clock, TrendingUp, BookOpen, MessageCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { useNavigate } from 'react-router-dom';

interface ProblemEditorProps {
	problemId: string | null;
}

export function ProblemEditor({ problemId }: ProblemEditorProps) {
	const navigate = useNavigate();
	const [showSubmitDialog, setShowSubmitDialog] = useState(false);
	const [code, setCode] = useState(`function twoSum(nums, target) {
		// Write your solution here
    
}`);

	const problem = {
		id: problemId || '1',
		title: 'Two Sum',
		difficulty: 'Easy',
		acceptance: '48.2%',
		description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
		examples: [
			{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
			{ input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: '' },
			{ input: 'nums = [3,3], target = 6', output: '[0,1]', explanation: '' }
		],
		constraints: ['2 <= nums.length <= 10⁴', '-10⁹ <= nums[i] <= 10⁹', '-10⁹ <= target <= 10⁹', 'Only one valid answer exists.']
	};

	return (
		<div className="h-[calc(100vh-73px)] flex flex-col">
			<div className="bg-white border-b border-gray-200 px-6 py-3">
				<div className="max-w-[1800px] mx-auto flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Button variant="ghost" size="sm" className="gap-2 text-gray-600 hover:text-[#1A237E]" onClick={() => navigate('/problems')}>
							<ArrowLeft className="w-4 h-4" />
							Back
						</Button>
						<div className="flex items-center gap-3">
							<h2 className="text-gray-900">{problem.title}</h2>
							<Badge className={problem.difficulty === 'Easy' ? 'bg-green-500' : problem.difficulty === 'Medium' ? 'bg-amber-500' : 'bg-red-500'}>{problem.difficulty}</Badge>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<Select defaultValue="javascript"><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="javascript">JavaScript</SelectItem><SelectItem value="python">Python</SelectItem><SelectItem value="java">Java</SelectItem><SelectItem value="cpp">C++</SelectItem><SelectItem value="typescript">TypeScript</SelectItem></SelectContent></Select>
					</div>
				</div>
			</div>

			<div className="flex-1 overflow-hidden">
				<div className="max-w-[1800px] mx-auto h-full grid grid-cols-2">
					<div className="border-r border-gray-200 overflow-y-auto">
						<div className="p-6">
							<Tabs defaultValue="description">
								<TabsList className="mb-6"><TabsTrigger value="description">Description</TabsTrigger><TabsTrigger value="solutions">Solutions</TabsTrigger><TabsTrigger value="discussions">Discussions</TabsTrigger></TabsList>
								<TabsContent value="description" className="space-y-6">
									<div><p className="text-gray-700 whitespace-pre-line mb-6">{problem.description}</p></div>
									<div><h3 className="text-gray-900 mb-4">Examples</h3><div className="space-y-4">{problem.examples.map((example, index) => (<Card key={index} className="p-4 bg-gray-50"><div className="space-y-2 font-mono text-sm"><div><span className="text-gray-600">Input: </span><span className="text-gray-900">{example.input}</span></div><div><span className="text-gray-600">Output: </span><span className="text-gray-900">{example.output}</span></div>{example.explanation && (<div><span className="text-gray-600">Explanation: </span><span className="text-gray-700">{example.explanation}</span></div>)}</div></Card>))}</div></div>
									<div><h3 className="text-gray-900 mb-3">Constraints</h3><ul className="space-y-2 text-gray-700 text-sm font-mono">{problem.constraints.map((constraint, index) => (<li key={index}>• {constraint}</li>))}</ul></div>
									<div className="pt-6 border-t border-gray-200"><div className="grid grid-cols-2 gap-4"><div className="flex items-center gap-3"><TrendingUp className="w-5 h-5 text-green-500" /><div><p className="text-gray-500 text-sm">Acceptance</p><p className="text-gray-900">{problem.acceptance}</p></div></div><div className="flex items-center gap-3"><BookOpen className="w-5 h-5 text-blue-500" /><div><p className="text-gray-500 text-sm">Submissions</p><p className="text-gray-900">2.3M</p></div></div></div></div>
									<div className="flex items-center gap-2 pt-4 border-t border-gray-200"><Button variant="outline" size="sm" className="gap-2"><ThumbsUp className="w-4 h-4" /><span>1.2K</span></Button><Button variant="outline" size="sm" className="gap-2"><ThumbsDown className="w-4 h-4" /><span>89</span></Button></div>
								</TabsContent>
								<TabsContent value="solutions"><div className="space-y-4"><p className="text-gray-600">View community solutions after solving the problem.</p></div></TabsContent>
								<TabsContent value="discussions"><div className="space-y-4"><Card className="p-4 hover:shadow-md transition-shadow cursor-pointer"><div className="flex items-start gap-3 mb-2"><MessageCircle className="w-5 h-5 text-[#00BCD4]" /><div className="flex-1"><h4 className="text-gray-900 mb-1">Optimal approach using Hash Map</h4><p className="text-gray-600 text-sm">Discussion about the most efficient solution...</p></div></div><div className="flex items-center gap-4 text-gray-500 text-sm"><span>45 replies</span><span>•</span><span>2 hours ago</span></div></Card></div></TabsContent>
							</Tabs>
						</div>
					</div>

					<div className="flex flex-col bg-[#1E1E1E]">
						<div className="bg-[#2D2D2D] px-4 py-2 flex items-center justify-between border-b border-gray-700">
							<div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-amber-500"></div><div className="w-3 h-3 rounded-full bg-green-500"></div><span className="ml-4 text-gray-400 text-sm">solution.js</span></div>
							<div className="flex items-center gap-2"><Button variant="outline" size="sm" className="bg-[#2D2D2D] border-gray-600 text-gray-300 hover:bg-[#3D3D3D] hover:text-white gap-2"><Play className="w-4 h-4" />Run Code</Button><Button size="sm" className="bg-[#00BCD4] hover:bg-[#00ACC1] text-white gap-2" onClick={() => setShowSubmitDialog(true)}><Send className="w-4 h-4" />Submit</Button></div>
						</div>
						<div className="flex-1 overflow-y-auto">
							<div className="font-mono text-sm">
								<div className="flex">
									<div className="bg-[#1E1E1E] px-4 py-4 text-gray-500 select-none">{code.split('\n').map((_, i) => (<div key={i} className="h-6 leading-6 text-right">{i + 1}</div>))}</div>
									<textarea value={code} onChange={(e) => setCode(e.target.value)} className="flex-1 bg-[#1E1E1E] text-gray-100 px-4 py-4 resize-none focus:outline-none font-mono leading-6" style={{ caretColor: '#00BCD4' }} spellCheck={false} />
								</div>
							</div>
						</div>
						<div className="bg-[#252526] border-t border-gray-700"><Tabs defaultValue="testcase"><div className="px-4 pt-2"><TabsList className="bg-[#2D2D2D]"><TabsTrigger value="testcase" className="data-[state=active]:bg-[#1E1E1E]">Testcase</TabsTrigger><TabsTrigger value="result" className="data-[state=active]:bg-[#1E1E1E]">Test Result</TabsTrigger></TabsList></div><TabsContent value="testcase" className="px-4 pb-4"><div className="space-y-2"><div className="bg-[#1E1E1E] rounded p-3"><p className="text-gray-400 text-sm mb-1">Input:</p><p className="text-gray-100 font-mono text-sm">nums = [2,7,11,15], target = 9</p></div></div></TabsContent><TabsContent value="result" className="px-4 pb-4"><div className="text-gray-400 text-sm">Run your code to see results</div></TabsContent></Tabs></div>
					</div>
				</div>
			</div>

			<Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}><DialogContent className="max-w-2xl"><DialogHeader><div className="flex items-center gap-3 mb-4"><div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle className="w-8 h-8 text-green-500" /></div><div><DialogTitle className="text-2xl text-green-600">Accepted</DialogTitle><DialogDescription>Your solution has been accepted!</DialogDescription></div></div></DialogHeader><div className="space-y-4"><div className="grid grid-cols-2 gap-4"><Card className="p-4 bg-green-50"><div className="flex items-center gap-3"><Clock className="w-8 h-8 text-green-600" /><div><p className="text-gray-600 text-sm">Runtime</p><p className="text-gray-900">68 ms</p><p className="text-green-600 text-xs">Beats 85.4%</p></div></div></Card><Card className="p-4 bg-blue-50"><div className="flex items-center gap-3"><TrendingUp className="w-8 h-8 text-blue-600" /><div><p className="text-gray-600 text-sm">Memory</p><p className="text-gray-900">42.3 MB</p><p className="text-blue-600 text-xs">Beats 91.2%</p></div></div></Card></div><div><h4 className="text-gray-900 mb-3">Test Cases</h4><div className="space-y-2">{[1, 2, 3].map((i) => (<div key={i} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg"><CheckCircle className="w-5 h-5 text-green-500" /><span className="text-gray-900">Test Case {i}</span><span className="ml-auto text-gray-500 text-sm">Passed</span></div>))}</div></div><div className="flex gap-3 pt-4"><Button className="flex-1 bg-[#00BCD4] hover:bg-[#00ACC1] text-white" onClick={() => { setShowSubmitDialog(false); navigate('/problems'); }}>Continue</Button><Button variant="outline" className="flex-1" onClick={() => setShowSubmitDialog(false)}>View Solutions</Button></div></div></DialogContent></Dialog>
		</div>
	);
}