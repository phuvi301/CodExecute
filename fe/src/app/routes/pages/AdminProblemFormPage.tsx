import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ArrowLeft, Save, Plus, Trash2, Loader2, Code2, AlertCircle, Upload, Download, FileText } from 'lucide-react';
import { adminCreateProblemApi, adminUpdateProblemApi, adminGetProblemDetailApi, TestCaseData } from '../../services/api';

const SAMPLE_TEMPLATE_TXT = `=== TESTCASE ===
TYPE: SAMPLE
INPUT:
2 7 11 15
9
OUTPUT:
0 1

=== TESTCASE ===
TYPE: HIDDEN
INPUT:
1 5 9 12
14
OUTPUT:
1 2
`;

function parseTestcasesTxt(text: string): TestCaseData[] {
  const blocks = text.split(/===\s*(?:TESTCASE|SAMPLE|HIDDEN)\s*===/i);
  const parsed: TestCaseData[] = [];

  for (const rawBlock of blocks) {
    const block = rawBlock.trim();
    if (!block) continue;

    let is_sample = true;
    if (/TYPE:\s*HIDDEN/i.test(block) || /IS_SAMPLE:\s*FALSE/i.test(block)) {
      is_sample = false;
    } else if (/TYPE:\s*SAMPLE/i.test(block) || /IS_SAMPLE:\s*TRUE/i.test(block)) {
      is_sample = true;
    }

    const inputMatch = block.match(/INPUT:\s*\n?([\s\S]*?)(?=\n?OUTPUT:|$)/i);
    const outputMatch = block.match(/OUTPUT:\s*\n?([\s\S]*?)$/i);

    const inputVal = inputMatch ? inputMatch[1].trim() : '';
    const outputVal = outputMatch ? outputMatch[1].trim() : '';

    if (inputVal || outputVal) {
      parsed.push({
        is_sample,
        input: inputVal,
        output: outputVal
      });
    }
  }

  return parsed;
}

export function AdminProblemFormPage() {
  const navigate = useNavigate();
  const { problemId } = useParams<{ problemId?: string }>();
  const isEditMode = Boolean(problemId);

  const [idInput, setIdInput] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Array & Hash Table');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [timeLimit, setTimeLimit] = useState<number>(2.0);
  const [memoryLimit, setMemoryLimit] = useState<number>(256);
  const [timeComplexity, setTimeComplexity] = useState('O(N)');
  const [spaceComplexity, setSpaceComplexity] = useState('O(1)');
  const [description, setDescription] = useState('');
  const [constraints, setConstraints] = useState('');
  
  const [testcases, setTestcases] = useState<TestCaseData[]>([
    { is_sample: true, input: '2 7 11 15\n9', output: '0 1' },
    { is_sample: false, input: '3 2 4\n6', output: '1 2' }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isEditMode && problemId) {
      async function loadProblemDetail() {
        setIsFetching(true);
        try {
          const data = await adminGetProblemDetailApi(problemId);
          setIdInput(data.problem_id || problemId);
          setTitle(data.title || '');
          setCategory(data.category || 'Array & Hash Table');
          setDifficulty(data.difficulty || 'Easy');
          setTimeLimit(data.time_limit || 2.0);
          setMemoryLimit(data.memory_limit || 256);
          setTimeComplexity(data.time_complexity || '');
          setSpaceComplexity(data.space_complexity || '');
          setDescription(data.description || '');
          setConstraints(data.constraints || '');
          if (Array.isArray(data.testcases) && data.testcases.length > 0) {
            setTestcases(data.testcases.map((tc: any) => ({
              testcase_id: tc.testcase_id,
              is_sample: Boolean(tc.is_sample),
              input: tc.input || '',
              output: tc.output || ''
            })));
          }
        } catch (err: any) {
          setError(err.message || 'Failed to fetch problem details.');
        } finally {
          setIsFetching(false);
        }
      }
      loadProblemDetail();
    }
  }, [isEditMode, problemId]);

  const handleAddTestcase = () => {
    setTestcases([
      ...testcases,
      { is_sample: testcases.length < 3, input: '', output: '' }
    ]);
  };

  const handleRemoveTestcase = (index: number) => {
    setTestcases(testcases.filter((_, i) => i !== index));
  };

  const handleTestcaseChange = (index: number, field: keyof TestCaseData, value: any) => {
    const updated = [...testcases];
    updated[index] = { ...updated[index], [field]: value };
    setTestcases(updated);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseTestcasesTxt(text);
        if (parsed.length > 0) {
          setTestcases(parsed);
          setSuccessMessage(`Successfully imported ${parsed.length} testcases from file '${file.name}'.`);
          setTimeout(() => setSuccessMessage(''), 5000);
        } else {
          setError('Failed to parse testcases from .txt file. Please make sure to follow the template format.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const element = document.createElement('a');
    const file = new Blob([SAMPLE_TEMPLATE_TXT], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = 'testcases_template.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const payload = {
        problem_id: idInput.trim() || undefined,
        title: title.trim(),
        category: category.trim(),
        difficulty,
        time_limit: Number(timeLimit),
        memory_limit: Number(memoryLimit),
        time_complexity: timeComplexity.trim(),
        space_complexity: spaceComplexity.trim(),
        description: description.trim(),
        constraints: constraints.trim(),
        testcases
      };

      if (isEditMode && problemId) {
        await adminUpdateProblemApi(problemId, payload);
      } else {
        await adminCreateProblemApi(payload);
      }

      navigate('/admin/problems');
    } catch (err: any) {
      setError(err.message || 'Failed to save problem.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading problem details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin/problems')} className="h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Code2 className="w-6 h-6 text-primary" />
              {isEditMode ? `Edit Problem: ${idInput}` : 'Create New Problem'}
            </h1>
            <p className="text-xs text-muted-foreground">Configure problem details, complexity specifications, and testcases suite.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-2">
          <FileText className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <Card className="bg-card border-border p-6 space-y-4">
          <CardHeader className="p-0 pb-3 border-b border-border/60">
            <CardTitle className="text-lg">1. Basic Information</CardTitle>
            <CardDescription className="text-xs">Title, Slug / Custom ID, Category, and Difficulty</CardDescription>
          </CardHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5 md:col-span-1">
              <Label className="text-xs font-semibold">Problem ID (Slug / Custom ID)</Label>
              <Input
                value={idInput}
                onChange={(e) => setIdInput(e.target.value)}
                placeholder="e.g. two-sum (leave empty to auto-generate)"
                disabled={isEditMode}
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold">Problem Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Two Sum"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Difficulty</Label>
              <Select value={difficulty} onValueChange={(val: 'Easy' | 'Medium' | 'Hard') => setDifficulty(val)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Category</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Array & Hash Table"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Time Limit (sec)</Label>
              <Input
                type="number"
                step="0.1"
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseFloat(e.target.value) || 2.0)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Memory Limit (MB)</Label>
              <Input
                type="number"
                value={memoryLimit}
                onChange={(e) => setMemoryLimit(parseInt(e.target.value) || 256)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Time Complexity</Label>
              <Input
                value={timeComplexity}
                onChange={(e) => setTimeComplexity(e.target.value)}
                placeholder="e.g. O(N) or O(N log N)"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Space Complexity</Label>
              <Input
                value={spaceComplexity}
                onChange={(e) => setSpaceComplexity(e.target.value)}
                placeholder="e.g. O(1) or O(N)"
              />
            </div>
          </div>
        </Card>

        {/* Content & Constraints Card */}
        <Card className="bg-card border-border p-6 space-y-4">
          <CardHeader className="p-0 pb-3 border-b border-border/60">
            <CardTitle className="text-lg">2. Description & Constraints</CardTitle>
            <CardDescription className="text-xs">Markdown problem statement and input/output constraints</CardDescription>
          </CardHeader>

          <div className="space-y-1.5 pt-2">
            <Label className="text-xs font-semibold">Problem Description (Markdown)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Given an array of integers nums and an integer target..."
              rows={6}
              className="font-mono text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Constraints (Markdown)</Label>
            <Textarea
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="2 <= nums.length <= 10^4&#10;-10^9 <= target <= 10^9"
              rows={3}
              className="font-mono text-xs"
              required
            />
          </div>
        </Card>

        {/* Testcases Manager Card with Batch .txt Upload */}
        <Card className="bg-card border-border p-6 space-y-4">
          <CardHeader className="p-0 pb-3 border-b border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <span>3. Testcases Management</span>
                <span className="text-xs font-normal text-muted-foreground">({testcases.length} items)</span>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Mark 'Sample' to display testcases for Run Code. Hidden testcases are evaluated during Submit Code.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" onClick={handleDownloadTemplate} variant="outline" size="sm" className="gap-1.5 text-xs">
                <Download className="w-3.5 h-3.5" />
                Template (.txt)
              </Button>

              <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1.5 rounded-md border border-border transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload .txt File</span>
                <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
              </label>

              <Button type="button" onClick={handleAddTestcase} variant="default" size="sm" className="gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" />
                Add Test Case
              </Button>
            </div>
          </CardHeader>

          {/* Testcases List */}
          <div className="space-y-4 pt-2">
            {testcases.length === 0 ? (
              <div className="text-center p-8 border border-dashed border-border rounded-xl text-muted-foreground text-xs">
                No testcases added yet. Click 'Add Test Case' or upload a .txt file.
              </div>
            ) : (
              testcases.map((tc, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border bg-accent/20 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-primary">#TestCase {idx + 1}</span>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium bg-background px-2.5 py-1 rounded-md border border-border">
                        <input
                          type="checkbox"
                          checked={tc.is_sample}
                          onChange={(e) => handleTestcaseChange(idx, 'is_sample', e.target.checked)}
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span>Sample Test Case (Visible for RUN)</span>
                      </label>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTestcase(idx)}
                      className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                      title="Remove testcase"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-muted-foreground">Input Data</Label>
                      <Textarea
                        value={tc.input}
                        onChange={(e) => handleTestcaseChange(idx, 'input', e.target.value)}
                        placeholder="Input parameters"
                        rows={2}
                        className="font-mono text-xs bg-background"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-muted-foreground">Expected Output</Label>
                      <Textarea
                        value={tc.output}
                        onChange={(e) => handleTestcaseChange(idx, 'output', e.target.value)}
                        placeholder="Expected output result"
                        rows={2}
                        className="font-mono text-xs bg-background"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/problems')} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="default" disabled={isLoading} className="gap-2 px-6 font-semibold shadow-md">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEditMode ? 'Update Problem' : 'Create Problem'}
          </Button>
        </div>
      </form>
    </div>
  );
}
