import 'package:flutter/material.dart';

enum PackageStatus {
  draft,
  pending,
  matched,
  inTransit,
  delivered,
  cancelled;

  static PackageStatus fromString(String? s) => switch (s) {
        'draft' => PackageStatus.draft,
        'matched' => PackageStatus.matched,
        'in_transit' => PackageStatus.inTransit,
        'delivered' => PackageStatus.delivered,
        'cancelled' => PackageStatus.cancelled,
        _ => PackageStatus.pending,
      };

  String get label => switch (this) {
        PackageStatus.draft => 'Draft',
        PackageStatus.pending => 'Pending',
        PackageStatus.matched => 'Matched',
        PackageStatus.inTransit => 'In Transit',
        PackageStatus.delivered => 'Delivered',
        PackageStatus.cancelled => 'Cancelled',
      };

  String get apiValue => switch (this) {
        PackageStatus.draft => 'draft',
        PackageStatus.pending => 'pending',
        PackageStatus.matched => 'matched',
        PackageStatus.inTransit => 'in_transit',
        PackageStatus.delivered => 'delivered',
        PackageStatus.cancelled => 'cancelled',
      };

  Color get color => switch (this) {
        PackageStatus.draft => const Color(0xFF9CA3AF),
        PackageStatus.pending => const Color(0xFFF59E0B),
        PackageStatus.matched => const Color(0xFF3B82F6),
        PackageStatus.inTransit => const Color(0xFF8B5CF6),
        PackageStatus.delivered => const Color(0xFF10B981),
        PackageStatus.cancelled => const Color(0xFF6B7280),
      };

  bool get isActive =>
      this == PackageStatus.draft ||
      this == PackageStatus.pending ||
      this == PackageStatus.matched ||
      this == PackageStatus.inTransit;
}

enum RequestStatus {
  pending,
  accepted,
  acceptedAwaitingInspection,
  inspectionInProgress,
  inspectionCompleted,
  rejectedAtInspectionUnderReview,
  approvedForTrip,
  refundApproved,
  partialRefundApproved,
  refundDeclined,
  rejected,
  intransit,
  delivering,
  completed,
  cancelled;

  /// Statuses where the request still needs attention or is being fulfilled.
  /// Keep this centralized so every request screen classifies the workflow
  /// consistently as new inspection states are added.
  bool get isActive => switch (this) {
        RequestStatus.pending ||
        RequestStatus.accepted ||
        RequestStatus.acceptedAwaitingInspection ||
        RequestStatus.inspectionInProgress ||
        RequestStatus.inspectionCompleted ||
        RequestStatus.rejectedAtInspectionUnderReview ||
        RequestStatus.approvedForTrip ||
        RequestStatus.intransit ||
        RequestStatus.delivering =>
          true,
        _ => false,
      };

  static RequestStatus fromString(String? s) => switch (s) {
        'accepted' => RequestStatus.accepted,
        'accepted_awaiting_inspection' =>
          RequestStatus.acceptedAwaitingInspection,
        'inspection_in_progress' => RequestStatus.inspectionInProgress,
        'inspection_completed' => RequestStatus.inspectionCompleted,
        'rejected_at_inspection_under_review' =>
          RequestStatus.rejectedAtInspectionUnderReview,
        'approved_for_trip' => RequestStatus.approvedForTrip,
        'refund_approved' => RequestStatus.refundApproved,
        'partial_refund_approved' => RequestStatus.partialRefundApproved,
        'refund_declined' => RequestStatus.refundDeclined,
        'rejected' => RequestStatus.rejected,
        'intransit' => RequestStatus.intransit,
        'delivering' => RequestStatus.delivering,
        'completed' || 'delivered' => RequestStatus.completed,
        'cancelled' => RequestStatus.cancelled,
        _ => RequestStatus.pending,
      };

  String get label => labelForRole(null);

  String labelForRole(String? role) {
    final isTraveler =
        role?.toLowerCase() == 'traveler' || role?.toLowerCase() == 'carrier';
    return switch (this) {
      RequestStatus.pending =>
        isTraveler ? 'Booking Received' : 'Awaiting Carrier',
      RequestStatus.accepted =>
        isTraveler ? 'Booking Confirmed' : 'Carrier Confirmed',
      RequestStatus.acceptedAwaitingInspection =>
        'Accepted — Awaiting Package Inspection',
      RequestStatus.inspectionInProgress => 'Inspection in Progress',
      RequestStatus.inspectionCompleted => 'Inspection Completed',
      RequestStatus.rejectedAtInspectionUnderReview =>
        'Rejected at Inspection — Under Review',
      RequestStatus.approvedForTrip => 'Approved for Trip',
      RequestStatus.refundApproved => 'Refund Approved',
      RequestStatus.partialRefundApproved => 'Partial Refund Approved',
      RequestStatus.refundDeclined => 'Refund Declined',
      RequestStatus.rejected =>
        isTraveler ? 'Booking Declined' : 'Request Declined',
      RequestStatus.intransit =>
        isTraveler ? 'Carrying Package' : 'Package In Transit',
      RequestStatus.delivering =>
        isTraveler ? 'Delivering Now' : 'Out for Delivery',
      RequestStatus.completed => 'Delivered',
      RequestStatus.cancelled => 'Cancelled',
    };
  }

  Color get color => switch (this) {
        RequestStatus.pending => const Color(0xFFF59E0B),
        RequestStatus.accepted => const Color(0xFF3B82F6),
        RequestStatus.acceptedAwaitingInspection => const Color(0xFF3B82F6),
        RequestStatus.inspectionInProgress => const Color(0xFFF59E0B),
        RequestStatus.inspectionCompleted => const Color(0xFF14B8A6),
        RequestStatus.rejectedAtInspectionUnderReview =>
          const Color(0xFFEF4444),
        RequestStatus.approvedForTrip => const Color(0xFF10B981),
        RequestStatus.refundApproved => const Color(0xFF10B981),
        RequestStatus.partialRefundApproved => const Color(0xFF10B981),
        RequestStatus.refundDeclined => const Color(0xFFEF4444),
        RequestStatus.intransit => const Color(0xFF8B5CF6),
        RequestStatus.delivering => const Color(0xFFF97316),
        RequestStatus.completed => const Color(0xFF10B981),
        RequestStatus.rejected => const Color(0xFFEF4444),
        RequestStatus.cancelled => const Color(0xFF6B7280),
      };

  String get apiValue => switch (this) {
        RequestStatus.acceptedAwaitingInspection =>
          'accepted_awaiting_inspection',
        RequestStatus.inspectionInProgress => 'inspection_in_progress',
        RequestStatus.inspectionCompleted => 'inspection_completed',
        RequestStatus.rejectedAtInspectionUnderReview =>
          'rejected_at_inspection_under_review',
        RequestStatus.approvedForTrip => 'approved_for_trip',
        RequestStatus.refundApproved => 'refund_approved',
        RequestStatus.partialRefundApproved => 'partial_refund_approved',
        RequestStatus.refundDeclined => 'refund_declined',
        _ => name,
      };
}

enum MessageType {
  text,
  image,
  file,
  system;

  static MessageType fromString(String? s) => switch (s) {
        'image' => MessageType.image,
        'file' => MessageType.file,
        'system' => MessageType.system,
        _ => MessageType.text,
      };
}
