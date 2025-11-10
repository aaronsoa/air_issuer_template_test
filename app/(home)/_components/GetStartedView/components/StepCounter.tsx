"use client";

interface StepCounterProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function StepCounter({ currentStep, totalSteps, className }: StepCounterProps) {
  return (
    <div className={`text-sm text-muted-foreground ${className || ""}`}>
      Step {currentStep} of {totalSteps}
    </div>
  );
}

