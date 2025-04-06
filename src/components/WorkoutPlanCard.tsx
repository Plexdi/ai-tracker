import { WorkoutPlan } from '../types/types';

export default function WorkoutPlanCard({ plan }: { plan: WorkoutPlan }) {
  return (
    <div className="border rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          Week {plan.week} - Day {plan.day}
        </h3>
        {plan.aiGenerated && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            AI Generated
          </span>
        )}
      </div>
      
      <ul className="space-y-2">
        {plan.exercises.map((exercise, index) => (
          <li key={index} className="border-b pb-2 last:border-b-0">
            <div className="flex justify-between">
              <span className="font-medium">{exercise.name}</span>
              <span>
                {exercise.sets}x{exercise.reps}
                {exercise.weight && ` @ ${exercise.weight}kg`}
                {exercise.rpe && ` RPE ${exercise.rpe}`}
              </span>
            </div>
          </li>
        ))}
      </ul>
      
      <div className="mt-4 text-xs text-gray-500">
        Created: {new Date(plan.created).toLocaleDateString()}
      </div>
    </div>
  );
} 