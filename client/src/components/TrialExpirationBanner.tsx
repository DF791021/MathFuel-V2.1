import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrialExpirationBannerProps {
  isExpired: boolean;
  daysRemaining?: number;
  trialEndDate?: Date;
  onDismiss?: () => void;
  onUpgradeClick?: () => void;
}

export const TrialExpirationBanner: React.FC<TrialExpirationBannerProps> = ({
  isExpired,
  daysRemaining,
  trialEndDate,
  onDismiss,
  onUpgradeClick,
}) => {
  if (!isExpired && (!daysRemaining || daysRemaining > 7)) {
    return null;
  }

  if (isExpired) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-50 border-b-2 border-red-500 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900">Your Wisconsin Nutrition Explorer trial has ended</p>
              <p className="text-sm text-red-700 mt-1">
                Your trial account is now in read-only mode. To continue using all features, please contact us to upgrade to an annual license.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={onUpgradeClick}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Schedule District Access
            </Button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1 hover:bg-red-100 rounded transition-colors"
                aria-label="Dismiss banner"
              >
                <X className="w-5 h-5 text-red-600" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show warning banner if expiring soon (within 7 days)
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b-2 border-amber-500 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-900">Your trial expires soon</p>
            <p className="text-sm text-amber-700 mt-1">
              {daysRemaining === 1
                ? 'Your Wisconsin Nutrition Explorer trial expires tomorrow.'
                : `Your trial expires in ${daysRemaining} days${
                    trialEndDate ? ` on ${new Date(trialEndDate).toLocaleDateString()}` : ''
                  }.`}
              {' '}Schedule your district access now to continue.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={onUpgradeClick}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Schedule Now
          </Button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-amber-100 rounded transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-5 h-5 text-amber-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
