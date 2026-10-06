export const passwordResetEmailTemplate = (
  name: string,
  resetUrl: string
) => {
  return `
    <!DOCTYPE html>
    <html>
      <body>
        <h2>Reset your EliteFlow password</h2>

        <p>Hello ${name},</p>

        <p>
          We received a request to reset your password.
        </p>

        <a href="${resetUrl}">
          Reset Password
        </a>

        <p>
          This link will expire in 15 minutes.
        </p>

        <p>
          If you did not request this, you can safely ignore this email.
        </p>
      </body>
    </html>
  `;
};