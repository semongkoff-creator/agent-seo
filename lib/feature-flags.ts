export const FEATURES = {
  /**
   * Show extended wizard steps (4-6: Demand, Authority, Conversion).
   * Set to false for the fundamentals-only MVP.
   */
  wizardExtendedSteps: process.env.NEXT_PUBLIC_WIZARD_EXTENDED_STEPS === 'true'
} as const;

export function getVisibleWizardSteps(): number[] {
  return FEATURES.wizardExtendedSteps ? [1, 2, 3, 4, 5, 6] : [1, 2, 3];
}

export function getFinalWizardStep(): number {
  return Math.max(...getVisibleWizardSteps());
}

export function isStepVisible(stepNumber: number): boolean {
  return getVisibleWizardSteps().includes(stepNumber);
}
