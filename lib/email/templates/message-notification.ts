export function messageNotificationTemplate(
  propertyTitle: string,
  messageExcerpt: string,
  messageUrl: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Message</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2c5f3c;">New Message About Your Property</h1>
    <p>You have received a new inquiry about <strong>${propertyTitle}</strong>:</p>
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; color: #666;">"${messageExcerpt}"</p>
    </div>
    <p>
      <a href="${messageUrl}"
         style="display: inline-block; padding: 12px 24px; background-color: #2c5f3c; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
        View Message
      </a>
    </p>
    <p style="color: #666; font-size: 14px;">You can reply to this inquiry from your dashboard.</p>
    <p style="color: #666; font-size: 12px;">Or copy and paste this link: ${messageUrl}</p>
  </div>
</body>
</html>
  `;
}
