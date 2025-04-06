import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useStore } from '../lib/zustandStore';
import { WeeklyProgress } from '../types/types';

interface ProgressChartProps {
  exercise: string;
  data?: {
    weights: number[];
    dates: string[];
    pr: {
      weight: number;
      date: string;
    };
  };
}

export default function ProgressChart({ exercise, data }: ProgressChartProps) {
  const liftLogs = useStore((state) => state.liftLogs);

  // If data is undefined or empty, show a placeholder
  if (!data?.weights?.length) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Log your first {exercise.toLowerCase()} to see progress
          </p>
        </div>
      </div>
    );
  }

  // Process lift logs to get weekly progress data
  const progressData: WeeklyProgress[] = liftLogs
    .filter(log => log.exercise === exercise)
    .reduce((acc: WeeklyProgress[], log) => {
      const date = new Date(log.date).toLocaleDateString();
      const existingEntry = acc.find(entry => entry.date === date);
      
      if (existingEntry) {
        existingEntry.maxWeight = Math.max(existingEntry.maxWeight, log.weight);
      } else {
        acc.push({
          date,
          maxWeight: log.weight,
          exercise: log.exercise
        });
      }
      
      return acc;
    }, [])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const chartData = data.weights.map((weight, index) => ({
    date: new Date(data.dates[index]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: weight
  }));

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
          <XAxis 
            dataKey="date"
            stroke="currentColor"
            className="text-gray-600 dark:text-gray-300 text-sm"
          />
          <YAxis
            stroke="currentColor"
            className="text-gray-600 dark:text-gray-300 text-sm"
            unit=" kg"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgb(31, 41, 55)',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white'
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: '#3B82F6', strokeWidth: 2 }}
            name={exercise}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 