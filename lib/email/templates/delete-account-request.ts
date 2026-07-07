export function deleteAccountRequestTemplate(userName: string, userEmail: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a1a;">Account Deletion Request</h2>
      <p>A user has requested account deletion. No data has been deleted — this is a notification only.</p>
      <table style="border-collapse: collapse; width: 100%; margin-top: 16px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #e0e0e0; font-weight: bold;">Name</td>
          <td style="padding: 8px; border: 1px solid #e0e0e0;">${userName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e0e0e0; font-weight: bold;">Email</td>
          <td style="padding: 8px; border: 1px solid #e0e0e0;">${userEmail}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e0e0e0; font-weight: bold;">Requested At</td>
          <td style="padding: 8px; border: 1px solid #e0e0e0;">${new Date().toUTCString()}</td>
        </tr>
      </table>
      <p style="margin-top: 24px; color: #666;">Please review and process this request manually.</p>
    </div>
  `;
}
