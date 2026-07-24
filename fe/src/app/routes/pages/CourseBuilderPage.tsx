import { useState } from 'react';
import { CourseBuilder } from '../../components/instructor/CourseBuilder';

export function CourseBuilderPage() {
  const [step, setStep] = useState(1);

  return <CourseBuilder step={step} setStep={setStep} />;
}