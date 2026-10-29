import { prisma } from "../config/database.js";

export const registerFcmToken = async (userId: string, token: string) => {
    return prisma.fcmToken.upsert({
        where: {token},
        update: {userId},
        create: {userId, token}
    });
};

export const findFcmTokensByUserId = async (userId: string) => {
    return prisma.fcmToken.findMany({
        where: {userId},
        select: {
            id: true,
            token: true,
            createdAt: true,
            updatedAt: true
        },
    });
};

export const deleteFcmToken = async (userId: string, token: string) => {
    return prisma.fcmToken.deleteMany({
        where: {userId, token},
    });
};