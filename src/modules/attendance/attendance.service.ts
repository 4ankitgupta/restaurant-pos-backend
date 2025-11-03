import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";
import { PunchType } from "@prisma/client";
import { startOfDay, endOfDay, differenceInMilliseconds } from "date-fns";

/**
 * Creates a new punch.
 * Logic: Finds the last punch for the day. If it was OUT or non-existent,
 * the new punch is IN. If it was IN, the new punch is OUT.
 */
export const createPunch = async (
  data: {
    employeeCode?: string;
    biometricId?: string;
    source?: string;
  },
  restaurantId: string
) => {
  const findClause = data.employeeCode
    ? { employeeCode: data.employeeCode, restaurantId }
    : { biometricId: data.biometricId, restaurantId };

  const employee = await prisma.employee.findFirst({
    where: findClause as any,
  });

  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, "Employee not found");
  }

  if (!employee.isActive) {
    throw new ApiError(httpStatus.FORBIDDEN, "Employee account is not active");
  }

  const todayStart = startOfDay(new Date());

  const lastPunch = await prisma.attendancePunch.findFirst({
    where: {
      employeeId: employee.id,
      timestamp: {
        gte: todayStart,
      },
    },
    orderBy: {
      timestamp: "desc",
    },
  });

  const newPunchType =
    !lastPunch || lastPunch.type === PunchType.OUT
      ? PunchType.IN
      : PunchType.OUT;

  const newPunch = await prisma.attendancePunch.create({
    data: {
      employeeId: employee.id,
      restaurantId,
      type: newPunchType,
      source: data.source ?? "unknown",
    },
  });

  return {
    employeeName: employee.name,
    punchType: newPunch.type,
    timestamp: newPunch.timestamp,
  };
};

/**
 * Calculates total work hours for all employees for a given date.
 */
export const getDailyReport = async (restaurantId: string, date: Date) => {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  const isToday = startOfDay(new Date()).getTime() === dayStart.getTime();

  const employees = await prisma.employee.findMany({
    where: { restaurantId, isActive: true },
    include: {
      attendancePunches: {
        where: {
          timestamp: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        orderBy: {
          timestamp: "asc",
        },
      },
    },
  });

  const report = employees.map((employee) => {
    let totalMilliseconds = 0;
    let lastInTime: Date | null = null;
    let status: "IN" | "OUT" = "OUT";

    for (const punch of employee.attendancePunches) {
      if (punch.type === PunchType.IN) {
        if (!lastInTime) {
          lastInTime = punch.timestamp;
          status = "IN";
        }
      } else if (punch.type === PunchType.OUT) {
        if (lastInTime) {
          totalMilliseconds += differenceInMilliseconds(
            punch.timestamp,
            lastInTime
          );
          lastInTime = null;
          status = "OUT";
        }
      }
    }

    // If it's today and the employee is still clocked in,
    // calculate hours up to the current time.
    if (isToday && lastInTime) {
      totalMilliseconds += differenceInMilliseconds(new Date(), lastInTime);
    }

    // Format totalMilliseconds into HH:mm
    const totalMinutes = Math.floor(totalMilliseconds / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const totalHoursWorked = `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}`;

    return {
      employeeId: employee.id,
      name: employee.name,
      employeeCode: employee.employeeCode,
      status: status,
      totalHoursWorked: totalHoursWorked,
      punches: employee.attendancePunches.map((p) => ({
        type: p.type,
        time: p.timestamp,
      })),
    };
  });

  return report;
};
