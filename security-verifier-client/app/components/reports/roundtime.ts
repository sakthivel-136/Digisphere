// app/components/reports/roundtime.ts

export interface RoundTime {
  start: string;
  end: string;
}

export const ROUND_TIMES: Record<number, RoundTime> = {
  1: { start: "6:00 AM", end: "7:00 AM" },
  2: { start: "7:00 AM", end: "8:00 AM" },
  3: { start: "8:00 AM", end: "9:00 AM" },
  4: { start: "9:00 AM", end: "10:00 AM" },
  5: { start: "10:00 AM", end: "11:00 AM" },
  6: { start: "11:00 AM", end: "12:00 PM" },
  7: { start: "12:00 PM", end: "1:00 PM" },
  8: { start: "1:00 PM", end: "2:00 PM" },
  9: { start: "2:00 PM", end: "3:00 PM" },
 10: { start: "3:00 PM", end: "4:00 PM" },
 11: { start: "4:00 PM", end: "5:00 PM" },
 12: { start: "5:00 PM", end: "6:00 PM" },
 13: { start: "6:00 PM", end: "7:00 PM" },
 14: { start: "7:00 PM", end: "8:00 PM" },
 15: { start: "8:00 PM", end: "9:00 PM" },
 16: { start: "9:00 PM", end: "10:00 PM" },
 17: { start: "10:00 PM", end: "10:30 PM" },
 18: { start: "10:30 PM", end: "11:00 PM" },
 19: { start: "11:00 PM", end: "11:30 PM" },
 20: { start: "11:30 PM", end: "12:00 AM" },
 21: { start: "12:00 AM", end: "12:30 AM" },
 22: { start: "12:30 AM", end: "1:00 AM" },
 23: { start: "1:00 AM", end: "1:30 AM" },
 24: { start: "1:30 AM", end: "2:00 AM" },
 25: { start: "2:00 AM", end: "2:30 AM" },
 26: { start: "2:30 AM", end: "3:00 AM" },
 27: { start: "3:00 AM", end: "3:30 AM" },
 28: { start: "3:30 AM", end: "4:00 AM" },
 29: { start: "4:00 AM", end: "4:30 AM" },
 30: { start: "4:30 AM", end: "5:00 AM" },
 31: { start: "5:00 AM", end: "5:30 AM" },
 32: { start: "5:30 AM", end: "6:00 AM" }
};
