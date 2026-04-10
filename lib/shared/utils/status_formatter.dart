String formatFrontendStatus(String? rawStatus) {
  final normalized = rawStatus?.trim().toLowerCase() ?? '';

  switch (normalized) {
    case 'pending':
    case 'pending_admin_review':
    case 'pending_review':
    case 'under_review':
      return 'Pending';
    case 'approved':
    case 'verified':
    case 'completed':
      return 'Verified';
    case 'rejected':
    case 'failed':
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
    default:
      return normalized
          .split('_')
          .where((part) => part.isNotEmpty)
          .map((part) => '${part[0].toUpperCase()}${part.substring(1)}')
          .join(' ');
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
    case 'under_review':
      return 'KYC In Review';
    default:
      return 'KYC Not Passed';
  }
}
