import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: 1 | 2;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    { number: 1, label: "Authorize" },
    { number: 2, label: "Store data" },
  ];

  return (
    <div className="flex items-center gap-6">
      {steps.map((step, index) => {
        const isActive = currentStep === step.number;
        const isCompleted = currentStep > step.number;

        return (
          <div key={step.number} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold transition-all ${
                isActive
                  ? "bg-green-500 text-white shadow-sm"
                  : isCompleted
                  ? "bg-green-500 text-white shadow-sm"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {isCompleted ? (
                <Check className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <span>{step.number}</span>
              )}
            </div>
            <span
              className={`text-sm font-medium transition-colors ${
                isActive
                  ? "text-green-600"
                  : isCompleted
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

