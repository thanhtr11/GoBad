import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../utils/api';

const memberSchema = z.object({
  clubId: z.string().min(1, 'Club is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  type: z.enum(['MEMBER', 'GUEST']),
  skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  membershipTier: z.enum(['ADULT', 'JUNIOR', 'FAMILY']).optional(),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberFormProps {
  clubId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const MemberForm: React.FC<MemberFormProps> = ({
  clubId,
  onSuccess,
  onCancel,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // Multi-step on mobile
  const isMobile = window.innerWidth < 768;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      clubId: clubId || '',
      type: 'MEMBER',
      skillLevel: 'INTERMEDIATE',
      membershipTier: 'ADULT',
    },
  });

  const memberType = watch('type');

  const onSubmit = async (data: MemberFormData) => {
    setIsLoading(true);
    try {
      await api.post('/members', {
        ...data,
        email: data.email || undefined,
        phone: data.phone || undefined,
      });
      onSuccess?.();
    } catch (error) {
      console.error('Failed to add member:', error);
      alert('Failed to add member. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Mobile multi-step form
  if (isMobile) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {step === 1 && (
            <>
              <h2 className="text-lg font-bold text-gray-900">Add Member - Basic Info</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Member Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  placeholder="Enter member name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="member@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Next
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-lg font-bold text-gray-900">Add Member - Details</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Member Type *
                </label>
                <select
                  {...register('type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="MEMBER">Regular Member</option>
                  <option value="GUEST">Guest</option>
                </select>
              </div>

              {memberType === 'MEMBER' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Skill Level
                    </label>
                    <select
                      {...register('skillLevel')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Membership Tier
                    </label>
                    <select
                      {...register('membershipTier')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ADULT">Adult</option>
                      <option value="JUNIOR">Junior</option>
                      <option value="FAMILY">Family</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Add Member'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    );
  }

  // Desktop single-step form
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Add New Member</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Member Name *
            </label>
            <input
              {...register('name')}
              type="text"
              placeholder="Enter member name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Member Type *
            </label>
            <select
              {...register('type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="MEMBER">Regular Member</option>
              <option value="GUEST">Guest</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="member@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone
            </label>
            <input
              {...register('phone')}
              type="tel"
              placeholder="+1 (555) 000-0000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {memberType === 'MEMBER' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Skill Level
                </label>
                <select
                  {...register('skillLevel')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Membership Tier
                </label>
                <select
                  {...register('membershipTier')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ADULT">Adult</option>
                  <option value="JUNIOR">Junior</option>
                  <option value="FAMILY">Family</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Add Member'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MemberForm;
