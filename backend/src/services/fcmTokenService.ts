import { deleteFcmToken, findFcmTokensByUserId, registerFcmToken } from "../repositories/fcmTokenRepository.js"

export const registerUserFcmToken = async (userId: string, token: string) => {
    return registerFcmToken(userId, token);
};

export const getUserFcmTokens = async (userId: string) => {
    return findFcmTokensByUserId(userId);
};

export const removeUserFcmToken = async (userId: string, token: string) => {
    return deleteFcmToken(userId, token);
};