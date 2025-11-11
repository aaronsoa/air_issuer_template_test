"use client";

import { useState } from "react";
import { DebuggingInfo, StepIndicator } from "./components";
import { IssuanceModal } from "./components/IssuanceModal";

export const GetStartedView = () => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  return (
    <div className="min-h-screen flex flex-col p-4 bg-white">
      {/* Step Indicator - Top Right */}
      <div className="w-full flex justify-end mb-8 pt-4 pr-4">
        <StepIndicator currentStep={currentStep} />
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 pb-16">
        <IssuanceModal currentStep={currentStep} onStepChange={setCurrentStep} />
        <DebuggingInfo />
      </div>
    </div>
  );
};
