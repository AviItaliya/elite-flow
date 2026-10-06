export const otpEmailTemplate = (
  name: string,
  otp: string
) => {
  return `
    <!DOCTYPE html>
    <html>
      <body>
        <h2>EliteFlow Login OTP</h2>

        <p>Hello ${name},</p>

        <p>Your login OTP is:</p>

        <h1>${otp}</h1>

        <p>
          This OTP will expire in 5 minutes.
        </p>

        <p>
          If you did not request this OTP, please ignore this email.
        </p>
      </body>
    </html>
  `;
};