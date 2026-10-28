import { prisma } from "../config/database.js";

export const findCompanyReminderHistory = async (
  companyId: string,
  page = 1,
  limit = 10
) => {
  const skip = (page - 1) * limit;

  const [reminders, total] = await prisma.$transaction([
    prisma.subscriptionReminder.findMany({
      where: {
        subscription: {
          companyId,
        },
      },
      include: {
        subscription: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            plan: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.subscriptionReminder.count({
      where: {
        subscription: { companyId },
      },
    }),
  ]);

  return {
    reminders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};