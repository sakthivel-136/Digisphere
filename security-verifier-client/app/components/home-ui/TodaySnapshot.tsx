import Link from "next/link";
import { Button } from "@/app/components/ui/PremiumButton";

interface SnapshotData {
  patrolsCompleted: number;
  patrolsInProgress: number;
  patrolsMissed: number;
  avgScanCompliance: number;
}

interface TodaySnapshotProps {
  data: SnapshotData;
}

export function TodaySnapshot({ data }: TodaySnapshotProps) {
  const getComplianceColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const totalPatrols =
    data.patrolsCompleted +
    data.patrolsInProgress +
    data.patrolsMissed;

  const completedPercentage =
    totalPatrols > 0
      ? Math.round((data.patrolsCompleted / totalPatrols) * 100)
      : 0;

  const inProgressPercentage =
    totalPatrols > 0
      ? Math.round((data.patrolsInProgress / totalPatrols) * 100)
      : 0;

  const missedPercentage =
    totalPatrols > 0
      ? Math.round((data.patrolsMissed / totalPatrols) * 100)
      : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Today's Performance Snapshot
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <p className="text-3xl font-bold text-green-600">
            {data.patrolsCompleted}
          </p>
          <p className="text-sm text-gray-600 mt-1">Completed</p>
        </div>

        <div className="text-center">
          <p className="text-3xl font-bold text-blue-600">
            {data.patrolsInProgress}
          </p>
          <p className="text-sm text-gray-600 mt-1">In Progress</p>
        </div>

        <div className="text-center">
          <p className="text-3xl font-bold text-red-600">
            {data.patrolsMissed}
          </p>
          <p className="text-sm text-gray-600 mt-1">Missed</p>
        </div>

        <div className="text-center">
          <p
            className={`text-3xl font-bold ${getComplianceColor(
              data.avgScanCompliance
            )}`}
          >
            {data.avgScanCompliance}%
          </p>
          <p className="text-sm text-gray-600 mt-1">Avg Compliance</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">
              Patrol Status
            </span>
            <span className="text-sm text-gray-500">
              {totalPatrols} Total
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="h-3 rounded-full flex">
              <div
                className="bg-green-500 rounded-l-full"
                style={{ width: `${completedPercentage}%` }}
                title={`Completed: ${completedPercentage}%`}
              />
              <div
                className="bg-blue-500"
                style={{ width: `${inProgressPercentage}%` }}
                title={`In Progress: ${inProgressPercentage}%`}
              />
              <div
                className="bg-red-500 rounded-r-full"
                style={{ width: `${missedPercentage}%` }}
                title={`Missed: ${missedPercentage}%`}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">
              Scan Compliance
            </span>
            <span
              className={`text-sm font-medium ${getComplianceColor(
                data.avgScanCompliance
              )}`}
            >
              {data.avgScanCompliance}%
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${getComplianceColor(
                data.avgScanCompliance
              ).replace("text-", "bg-")}`}
              style={{ width: `${data.avgScanCompliance}%` }}
            />
          </div>
        </div>
      </div>

      {/* ✅ UPDATED ROUTING BUTTON ONLY */}
      <div className="mt-6 flex justify-center">
        <Button size="sm" variant="secondary" onClick={() => { window.location.href = '/report-download' }}>
            View Detailed Report
        </Button>
      </div>
    </div>
  );
}
