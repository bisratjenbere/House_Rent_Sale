export function propertyStatusNotificationTemplate(
  propertyTitle: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string
): string {
  const isApproved = status === 'approved';
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Property ${isApproved ? 'Approved' : 'Not Approved'}</title></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <h1 style="color:${isApproved ? '#10b981' : '#ef4444'};">Property ${isApproved ? 'Approved' : 'Not Approved'}</h1>
    <p>Your property <strong>${propertyTitle}</strong> has been ${isApproved ? 'approved and is now live' : 'reviewed'}.</p>
    ${isApproved
      ? `<div style="background:#d1fae5;padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #10b981;">
           <p style="margin:0;color:#065f46;font-weight:bold;">✓ Your listing is now visible to the public</p>
         </div>`
      : `<div style="background:#fee2e2;padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #ef4444;">
           <p style="margin:0 0 10px 0;color:#991b1b;font-weight:bold;">Reason for rejection:</p>
           <p style="margin:0;color:#7f1d1d;">${rejectionReason}</p>
         </div>
         <p>You can edit your property and resubmit it for review.</p>`
    }
    <p><a href="${process.env.NEXTAUTH_URL}/dashboard/properties" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">Go to Dashboard</a></p>
  </div>
</body>
</html>`;
}
