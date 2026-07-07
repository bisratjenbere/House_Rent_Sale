export function reviewNotificationTemplate(
  propertyTitle: string,
  rating: number,
  commentExcerpt: string,
  propertyUrl: string
): string {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>New Review</title></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <h1 style="color:#2c5f3c;">New Review on Your Property</h1>
    <p>You received a new <strong>${rating}-star</strong> review on <strong>${propertyTitle}</strong>:</p>
    <div style="background:#f3f4f6;padding:15px;border-radius:6px;margin:20px 0;">
      <div style="font-size:24px;color:#fbbf24;margin-bottom:10px;">${stars}</div>
      <p style="margin:0;color:#666;">"${commentExcerpt}"</p>
    </div>
    <p><a href="${propertyUrl}" style="display:inline-block;padding:12px 24px;background:#2c5f3c;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">View Full Review</a></p>
    <p style="color:#666;font-size:12px;">Or copy and paste: ${propertyUrl}</p>
  </div>
</body>
</html>`;
}
