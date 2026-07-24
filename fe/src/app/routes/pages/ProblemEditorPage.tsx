import { useParams } from 'react-router-dom';
import { ProblemEditor } from '../../components/problems/ProblemEditor';

export function ProblemEditorPage() {
  const params = useParams();

  return <ProblemEditor problemId={params.problemId ?? null} />;
}