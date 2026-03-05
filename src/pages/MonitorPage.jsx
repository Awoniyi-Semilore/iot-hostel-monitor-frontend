import { useState, useEffect } from 'react';
import { useReadings } from '../queries/useReadings';
import { useSnooze } from '../queries/useSnooze';

import BootScreen from '../components/BootScreen';
import SystemHealth from '../components/SystemHealth';
import AirQualityCard from '../components/AirQualityCard';
import StatusDuration from '../components/StatusDuration';
import SprayOverride from '../components/SprayOverride';
import ErrorBanner from '../components/ErrorBanner';

export default function MonitorPage() {
  const { data, isLoading, isError, error, isFetching, refetch } = useReadings();
  const { start: startSnooze, cancel: cancelSnooze } = useSnooze();

  const reading = data?.data[0] ?? null;
  const status = reading?.status ?? 'unknown';
  const isLive = !!reading;
  const isMaintenance = reading?.cooldown_until
    ? new Date(reading.cooldown_until) > new Date()
    : false;

  // Countdown timer driven by backend cooldown_until
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (!reading?.cooldown_until) return;
    const endTime = new Date(reading.cooldown_until).getTime();
    const update = () => setTimeLeft(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [reading?.cooldown_until]);

  const handleStartMaintenance = () => reading?.device_id && startSnooze.mutate(reading.device_id);
  const handleCancelMaintenance = () => reading?.device_id && cancelSnooze.mutate(reading.device_id);

  return (
    <div className="flex flex-col items-center py-8 px-4">
      <div className="max-w-md w-full space-y-6">
        {isLoading ? (
          <BootScreen bootMessage="Connecting to JAJA Hall sensors..." />
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <SystemHealth
              isMaintenance={isMaintenance}
              isLive={isLive}
              loading={isFetching}
              onRefresh={refetch}
            />
            <AirQualityCard
              status={status}
              isLive={isLive}
              lastSync={reading ? new Date(reading.updated_at) : null}
              isMaintenance={isMaintenance}
              timeLeft={timeLeft}
              onCancelMaintenance={handleCancelMaintenance}
            />
            {!isMaintenance && isLive && (
              <StatusDuration rawValue={reading.raw_value} voltage={reading.voltage} />
            )}
            {!isMaintenance && isLive && (
              <SprayOverride onStart={handleStartMaintenance} />
            )}
            {isError && !isLive && (
              <ErrorBanner error={error?.message ?? 'Connection failed.'} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
