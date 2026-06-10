import { afterEach, describe, expect, it, vi } from 'vitest';

const originalFlag = process.env.NEXT_PUBLIC_WIZARD_EXTENDED_STEPS;

async function loadFlags() {
  vi.resetModules();
  return import('@/lib/feature-flags');
}

afterEach(() => {
  if (originalFlag === undefined) {
    delete process.env.NEXT_PUBLIC_WIZARD_EXTENDED_STEPS;
  } else {
    process.env.NEXT_PUBLIC_WIZARD_EXTENDED_STEPS = originalFlag;
  }
});

describe('feature-flags', () => {
  it('defaults to fundamentals mode', async () => {
    delete process.env.NEXT_PUBLIC_WIZARD_EXTENDED_STEPS;

    const { FEATURES, getFinalWizardStep, getVisibleWizardSteps, isStepVisible } = await loadFlags();

    expect(FEATURES.wizardExtendedSteps).toBe(false);
    expect(getVisibleWizardSteps()).toEqual([1, 2, 3]);
    expect(getFinalWizardStep()).toBe(3);
    expect(isStepVisible(4)).toBe(false);
  });

  it('enables the extended wizard when the env flag is true', async () => {
    process.env.NEXT_PUBLIC_WIZARD_EXTENDED_STEPS = 'true';

    const { FEATURES, getFinalWizardStep, getVisibleWizardSteps, isStepVisible } = await loadFlags();

    expect(FEATURES.wizardExtendedSteps).toBe(true);
    expect(getVisibleWizardSteps()).toEqual([1, 2, 3, 4, 5, 6]);
    expect(getFinalWizardStep()).toBe(6);
    expect(isStepVisible(6)).toBe(true);
  });
});
