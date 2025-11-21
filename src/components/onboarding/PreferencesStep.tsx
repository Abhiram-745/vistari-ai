import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { StudyPreferences, DayTimeSlot } from "../OnboardingWizard";
import { Card } from "@/components/ui/card";

interface PreferencesStepProps {
  preferences: StudyPreferences;
  setPreferences: (prefs: StudyPreferences) => void;
}

const PreferencesStep = ({ preferences, setPreferences }: PreferencesStepProps) => {
  const weekDays = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
  ];

  const toggleDay = (day: string) => {
    setPreferences({
      ...preferences,
      day_time_slots: preferences.day_time_slots.map((slot) =>
        slot.day === day ? { ...slot, enabled: !slot.enabled } : slot
      ),
    });
  };

  const updateTimeSlot = (day: string, field: 'startTime' | 'endTime', value: string) => {
    setPreferences({
      ...preferences,
      day_time_slots: preferences.day_time_slots.map((slot) =>
        slot.day === day ? { ...slot, [field]: value } : slot
      ),
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="daily-hours">Daily Study Hours (Target)</Label>
          <Input
            id="daily-hours"
            type="number"
            min="1"
            max="12"
            value={preferences.daily_study_hours}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                daily_study_hours: parseInt(e.target.value) || 2,
              })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="session-duration">Session Duration (mins)</Label>
            <Input
              id="session-duration"
              type="number"
              min="15"
              max="120"
              value={preferences.session_duration}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  session_duration: parseInt(e.target.value) || 45,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="break-duration">Break Duration (mins)</Label>
            <Input
              id="break-duration"
              type="number"
              min="5"
              max="60"
              value={preferences.break_duration}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  break_duration: parseInt(e.target.value) || 15,
                })
              }
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Study Days & Time Periods</Label>
          <p className="text-sm text-muted-foreground">
            Select days and set specific time periods for each day
          </p>
          <div className="space-y-2">
            {weekDays.map((day) => {
              const slot = preferences.day_time_slots.find((s) => s.day === day.value);
              return (
                <Card key={day.value} className="p-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2 min-w-[120px]">
                      <Checkbox
                        id={day.value}
                        checked={slot?.enabled || false}
                        onCheckedChange={() => toggleDay(day.value)}
                      />
                      <label
                        htmlFor={day.value}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {day.label}
                      </label>
                    </div>
                    
                    {slot?.enabled && (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateTimeSlot(day.value, 'startTime', e.target.value)}
                          className="w-32"
                        />
                        <span className="text-sm text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateTimeSlot(day.value, 'endTime', e.target.value)}
                          className="w-32"
                        />
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesStep;
