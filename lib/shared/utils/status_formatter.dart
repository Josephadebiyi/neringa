String formatFrontendStatus(String? rawStatus) {
  final normalized = rawStatus?.trim().toLowerCase() ?? '';

  switch (normalized) {
    case 'pending':
    case 'pending_admin_review':
    case 'pending_review':
    case 'admin_review':
    case 'manual_review':
    case 'kyc_review':
    case 'under_review':
      return 'Pending';
    case 'approved':
    case 'verified':
    case 'completed':
      return 'Verified';
    case 'rejected':
    case 'declined':
    case 'failed':
    case 'failed_verification':
    case 'blocked_duplicate':
    case 'expired':
      return 'Rejected';
    case 'not_started':
    case '':
      return 'Not Started';
    case 'active':
      return 'Active';
    case 'upcoming':
      return 'Upcoming';
    case 'matched':
      return 'Matched';
    case 'accepted':
      return 'Accepted';
    case 'in_transit':
    case 'intransit':
    case 'delivering':
      return 'In Transit';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    case 'awaiting_sender_confirmation':
      return 'Awaiting Confirmation';
    default:
      if (normalized.contains('_')) return 'Pending';
      return normalized
          .split('_')
          .where((part) => part.isNotEmpty)
          .map((part) => '${part[0].toUpperCase()}${part.substring(1)}')
          .join(' ');
  }
}

String formatTripStatusLabel(String? rawStatus) {
  final normalized = rawStatus?.trim().toLowerCase() ?? '';

  switch (normalized) {
    case 'pending':
      return 'Pending';
    case 'pending_admin_review':
    case 'pending_review':
    case 'admin_review':
      return 'Under Review';
    case 'active':
    case 'verified':
    case 'approved':
    case 'live':
      return 'Live';
    case 'completed':
      return 'Completed';
    case 'declined':
    case 'rejected':
      return 'Declined';
    case 'cancelled':
      return 'Cancelled';
    default:
      return formatFrontendStatus(rawStatus);
  }
}

String formatKycStatusLabel(String? rawStatus) {
  final normalized = rawStatus?.trim().toLowerCase() ?? '';

  switch (normalized) {
    case 'approved':
    case 'verified':
    case 'completed':
      return 'KYC Passed';
    case 'pending':
    case 'pending_admin_review':
    case 'pending_review':
    case 'admin_review':
    case 'manual_review':
    case 'kyc_review':
    case 'under_review':
      return 'KYC In Review';
    case 'declined':
    case 'rejected':
    case 'failed':
    case 'failed_verification':
      return 'KYC Not Approved';
    case 'blocked_duplicate':
      return 'Contact Support';
    default:
      return 'KYC Not Passed';
  }
}
