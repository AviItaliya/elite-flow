export const verificationEmailTemplate = (
  name: string,
  verificationUrl: string
) => {
  return `
    <!DOCTYPE html>
    <html>
      <body>
        <h2>Welcome to EliteFlow, ${name}!</h2>

        <p>
          Thank you for creating your EliteFlow account.
        </p>

        <p>
          Please verify your email address by clicking the button below.
        </p>

        <a href="${verificationUrl}">
          Verify Email
        </a>

        <p>
          This verification link will expire in 24 hours.
        </p>
      </body>
    </html>
  `;
};