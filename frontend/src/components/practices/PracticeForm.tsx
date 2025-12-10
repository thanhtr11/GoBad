import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../utils/api';

const practiceSchema = z.object({
  clubId: z.string().min(1, 'Club is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  court: z.string().min(1, 'Court is required'),
  isTournament: z.boolean().optional(),
});

type PracticeFormData = z.infer<typeof practiceSchema>;

interface PracticeFormProps {
  clubId: string;
  defaultDate?: Date;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PracticeForm: React.FC<PracticeFormProps> = ({
  clubId,
  defaultDate,
  onSuccess,
  onCancel,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const defaultDateStr = defaultDate
    ? defaultDate.toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PracticeFormData>({
    resolver: zodResolver(practiceSchema),
    defaultValues: {
      clubId,
      date: defaultDateStr,
      startTime: '18:00',
      endTime: '20:00',
      court: 'Court 1',
      isTournament: false,
    },
  });

  const onSubmit = async (data: PracticeFormData) => {
    setIsLoading(true);
    setError('');
    try {
      // Combine date and time into proper ISO datetime format
      const dateStr = data.date;
      const startDateTime = new Date(`${dateStr}T${data.startTime}:00`).toISOString();
      const endDateTime = new Date(`${dateStr}T${data.endTime}:00`).toISOString();
      const dateISO = new Date(`${dateStr}T00:00:00`).toISOString();

      await api.post('/practices', {
        clubId: data.clubId,
        date: dateISO,
        startTime: startDateTime,
        endTime: endDateTime,
        court: data.court,
        isTournament: data.isTournament,
      });
      onSuccess?.();
    } catch (err: any) {
      console.error('Failed to schedule practice:', err);
      setError(err.response?.data?.message || err.message || 'Failed to schedule practice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Schedule Practice</h2>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date *
            </label>
            <input
              {...register('date')}
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.date && (
              <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Court *
            </label>
            <input
              {...register('court')}
              type="text"
              placeholder="e.g., Court 1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.court && (
              <p className="text-red-600 text-sm mt-1">{errors.court.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Start Time *
            </label>
            <input
              {...register('startTime')}
              type="time"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.startTime && (
              <p className="text-red-600 text-sm mt-1">{errors.startTime.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              End Time *
            </label>
            <input
              {...register('endTime')}
              type="time"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.endTime && (
              <p className="text-red-600 text-sm mt-1">{errors.endTime.message}</p>
            )}
          </div>



          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                {...register('isTournament')}
                type="checkbox"
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-gray-700">Tournament Mode</span>
            </label>
          </div>
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
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Scheduling...' : 'Schedule Practice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PracticeForm;
