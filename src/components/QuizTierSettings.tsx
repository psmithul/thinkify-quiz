'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';

interface TierThreshold {
  min_score: number;
  max_score: number;
}

interface TierThresholds {
  tier_1: TierThreshold;
  tier_2: TierThreshold;
  tier_3: TierThreshold;
  tier_4: TierThreshold;
  tier_5: TierThreshold;
}

interface QuizTierSettingsProps {
  initialThresholds?: TierThresholds;
  onSave: (thresholds: TierThresholds) => void;
  className?: string;
}

const DEFAULT_THRESHOLDS: TierThresholds = {
  tier_1: { min_score: 0, max_score: 20 },
  tier_2: { min_score: 21, max_score: 40 },
  tier_3: { min_score: 41, max_score: 60 },
  tier_4: { min_score: 61, max_score: 80 },
  tier_5: { min_score: 81, max_score: 100 }
};

const TIER_INFO = {
  tier_1: { label: 'Beginner', color: 'bg-red-100 text-red-800', description: 'Entry-level performance' },
  tier_2: { label: 'Basic', color: 'bg-orange-100 text-orange-800', description: 'Basic understanding' },
  tier_3: { label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800', description: 'Good grasp of concepts' },
  tier_4: { label: 'Proficient', color: 'bg-lime-100 text-lime-800', description: 'Strong performance' },
  tier_5: { label: 'Expert', color: 'bg-green-100 text-green-800', description: 'Excellent mastery' }
};

export function QuizTierSettings({ initialThresholds, onSave, className = '' }: QuizTierSettingsProps) {
  const [thresholds, setThresholds] = useState<TierThresholds>(
    initialThresholds || DEFAULT_THRESHOLDS
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (initialThresholds) {
      setThresholds(initialThresholds);
    }
  }, [initialThresholds]);

  const validateThresholds = (newThresholds: TierThresholds): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    
    // Check that each tier's min_score is less than max_score
    Object.entries(newThresholds).forEach(([tierKey, tier]) => {
      if (tier.min_score >= tier.max_score) {
        newErrors[tierKey] = 'Minimum score must be less than maximum score';
      }
      if (tier.min_score < 0 || tier.max_score > 100) {
        newErrors[tierKey] = 'Scores must be between 0 and 100';
      }
    });

    // Check that tiers don't overlap and are continuous
    const tiers = Object.entries(newThresholds).sort(([a], [b]) => a.localeCompare(b));
    for (let i = 0; i < tiers.length - 1; i++) {
      const [currentKey, currentTier] = tiers[i];
      const [nextKey, nextTier] = tiers[i + 1];
      
      if (currentTier.max_score + 1 !== nextTier.min_score) {
        newErrors[nextKey] = `Gap or overlap detected. Should start at ${currentTier.max_score + 1}`;
      }
    }

    // Check first tier starts at 0 and last tier ends at 100
    if (newThresholds.tier_1.min_score !== 0) {
      newErrors.tier_1 = 'First tier must start at 0';
    }
    if (newThresholds.tier_5.max_score !== 100) {
      newErrors.tier_5 = 'Last tier must end at 100';
    }

    return newErrors;
  };

  const updateTier = (tierKey: keyof TierThresholds, field: 'min_score' | 'max_score', value: number) => {
    const newThresholds = {
      ...thresholds,
      [tierKey]: {
        ...thresholds[tierKey],
        [field]: value
      }
    };

    setThresholds(newThresholds);
    setIsDirty(true);
    
    // Validate in real-time
    const newErrors = validateThresholds(newThresholds);
    setErrors(newErrors);
  };

  const handleSave = () => {
    const validationErrors = validateThresholds(thresholds);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      onSave(thresholds);
      setIsDirty(false);
    }
  };

  const handleReset = () => {
    setThresholds(initialThresholds || DEFAULT_THRESHOLDS);
    setErrors({});
    setIsDirty(false);
  };

  const handlePreset = (preset: 'easy' | 'normal' | 'hard') => {
    let newThresholds: TierThresholds;
    
    switch (preset) {
      case 'easy':
        newThresholds = {
          tier_1: { min_score: 0, max_score: 30 },
          tier_2: { min_score: 31, max_score: 50 },
          tier_3: { min_score: 51, max_score: 70 },
          tier_4: { min_score: 71, max_score: 85 },
          tier_5: { min_score: 86, max_score: 100 }
        };
        break;
      case 'hard':
        newThresholds = {
          tier_1: { min_score: 0, max_score: 15 },
          tier_2: { min_score: 16, max_score: 30 },
          tier_3: { min_score: 31, max_score: 50 },
          tier_4: { min_score: 51, max_score: 75 },
          tier_5: { min_score: 76, max_score: 100 }
        };
        break;
      default: // normal
        newThresholds = DEFAULT_THRESHOLDS;
    }
    
    setThresholds(newThresholds);
    setIsDirty(true);
    setErrors({});
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Tier Scoring Thresholds</h3>
        <p className="text-sm text-gray-600 mb-4">
          Define score ranges for each performance tier. These determine which company opportunities users qualify for.
        </p>
        
        {/* Preset buttons */}
        <div className="flex gap-2 mb-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePreset('easy')}
          >
            Easy Quiz
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePreset('normal')}
          >
            Normal Quiz
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePreset('hard')}
          >
            Hard Quiz
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(thresholds).map(([tierKey, tier]) => {
          const tierInfo = TIER_INFO[tierKey as keyof typeof TIER_INFO];
          const hasError = errors[tierKey];
          
          return (
            <div key={tierKey} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${tierInfo.color}`}>
                    Tier {tierKey.split('_')[1]}: {tierInfo.label}
                  </span>
                  <span className="text-sm text-gray-500">{tierInfo.description}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={tier.min_score}
                    onChange={(e) => updateTier(tierKey as keyof TierThresholds, 'min_score', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      hasError ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={tier.max_score}
                    onChange={(e) => updateTier(tierKey as keyof TierThresholds, 'max_score', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      hasError ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>

              {hasError && (
                <p className="text-red-600 text-sm mt-2">{hasError}</p>
              )}

              <div className="mt-2 text-sm text-gray-500">
                Score range: {tier.min_score}% - {tier.max_score}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual representation */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Score Distribution</h4>
        <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
          {Object.entries(thresholds).map(([tierKey, tier], index) => {
            const tierInfo = TIER_INFO[tierKey as keyof typeof TIER_INFO];
            const width = tier.max_score - tier.min_score + 1;
            const left = tier.min_score;
            
            return (
              <div
                key={tierKey}
                className={`absolute h-full ${tierInfo.color.split(' ')[0]}`}
                style={{
                  left: `${left}%`,
                  width: `${width}%`
                }}
                title={`Tier ${tierKey.split('_')[1]}: ${tier.min_score}% - ${tier.max_score}%`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!isDirty}
        >
          Reset
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!isDirty || Object.keys(errors).length > 0}
        >
          Save Tier Settings
        </Button>
      </div>

      {/* Help text */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-2">
          <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">How Tier Thresholds Work:</p>
            <ul className="text-xs space-y-1">
              <li>• Users who score in Tier 5 qualify for all company tiers (1-5)</li>
              <li>• Users who score in Tier 3 qualify for company tiers 1-3</li>
              <li>• Higher scores unlock access to better company opportunities</li>
              <li>• Use "Easy Quiz" preset for introductory content, "Hard Quiz" for advanced topics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 