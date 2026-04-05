import { useTimerTick } from "../hooks/use-timer-tick";

export default function TimerTickProvider() {
  useTimerTick();
  return null;
}
