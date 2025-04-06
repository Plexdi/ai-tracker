import { useState } from 'react';
import { useStore } from '../lib/zustandStore';
import { saveLiftLog } from '../lib/api';

export default function LiftLogger() {
  const currentUser = useStore((state) => state.currentUser);
  const addLiftLog = useStore((state) => state.addLiftLog);

  const [formData, setFormData] = useState({
    exercise: '',
    weight: '',
    sets: '',
    reps: '',
    rpe: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const log = {
      userId: currentUser.id,
      exercise: formData.exercise,
      weight: Number(formData.weight),
      sets: Number(formData.sets),
      reps: Number(formData.reps),
      rpe: Number(formData.rpe),
      notes: formData.notes,
      date: new Date().toISOString(),
    };

    try {
      const savedLog = await saveLiftLog(log);
      addLiftLog(savedLog);
      setFormData({
        exercise: '',
        weight: '',
        sets: '',
        reps: '',
        rpe: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error saving lift log:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4">
      <div>
        <input
          type="text"
          name="exercise"
          placeholder="Exercise"
          value={formData.exercise}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <input
          type="number"
          name="weight"
          placeholder="Weight (kg/lbs)"
          value={formData.weight}
          onChange={handleChange}
          className="p-2 border rounded"
          required
        />
        <input
          type="number"
          name="sets"
          placeholder="Sets"
          value={formData.sets}
          onChange={handleChange}
          className="p-2 border rounded"
          required
        />
        <input
          type="number"
          name="reps"
          placeholder="Reps"
          value={formData.reps}
          onChange={handleChange}
          className="p-2 border rounded"
          required
        />
        <input
          type="number"
          name="rpe"
          placeholder="RPE (1-10)"
          value={formData.rpe}
          onChange={handleChange}
          className="p-2 border rounded"
          min="1"
          max="10"
          required
        />
      </div>
      <div>
        <textarea
          name="notes"
          placeholder="Notes (optional)"
          value={formData.notes}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
      >
        Log Lift
      </button>
    </form>
  );
} 