import 'package:flutter/material.dart';

enum PackageStatus {
  pending,
  matched,
  inTransit,
  delivered,
  cancelled;

  static PackageStatus fromString(String? s) => switch (s) {
        'matched' => PackageStatus.matched,
        'in_transit' => PackageStatus.inTransit,
        'delivered' => PackageStatus.delivered,
        'cancelled' => PackageStatus.cancelled,
        _ => PackageStatus.pending,
      };

  String get label => switch (this) {
        PackageStatus.pending => 'Pending',
        PackageStatus.matched => 'Matched',
        PackageStatus.inTransit => 'In Transit',
        PackageStatus.delivered => 'Delivered',
        PackageStatus.cancelled => 'Cancelled',
      };

  String get apiValue => switch (this) {
        PackageStatus.pending => 'pending',
        PackageStatus.matched => 'matched',
        PackageStatus.inTransit => 'in_transit',
        PackageStatus.delivered => 'delivered',
        PackageStatus.cancelled => 'cancelled',
      };

  Color get color => switch (this) {
        PackageStatus.pending   => const Color(0xFFF59E0B),
        PackageStatus.matched   => const Color(0xFF3B82F6),
        PackageStatus.inTransit => const Color(0xFF8B5CF6),
        PackageStatus.delivered => const Color(0xFF10B981),
        PackageStatus.cancelled => const Color(0xFF6B7280),
      };

  bool get isActive =>
      this == PackageStatus.pending ||
      this == PackageStatus.matched ||
      this == PackageStatus.inTransit;
}

enum RequestStatus {
  pending,
  accepted,
  rejected,
  intransit,
  delivering,
  completed,
  cancelled;

  static RequestStatus fromString(String? s) => switch (s) {
        'accepted' => RequestStatus.accepted,
        'rejected' => RequestStatus.rejected,
        'intransit' => RequestStatus.intransit,
        'delivering' => RequestStatus.delivering,
        'completed' || 'delivered' => RequestStatus.completed,
        'cancelled' => RequestStatus.cancelled,
        _ => RequestStatus.pending,
      };

  String get label => switch (this) {
        RequestStatus.pending => 'Pending',
        RequestStatus.accepted => 'Accepted',
        RequestStatus.rejected => 'Rejected',
        RequestStatus.intransit => 'In Transit',
        RequestStatus.delivering => 'Delivering',
        RequestStatus.completed => 'Delivered',
        RequestStatus.cancelled => 'Cancelled',
      };

  Color get color => switch (this) {
        RequestStatus.pending   => const Color(0xFFF59E0B),
        RequestStatus.accepted  => const Color(0xFF3B82F6),
        RequestStatus.intransit => const Color(0xFF8B5CF6),
        RequestStatus.delivering=> const Color(0xFFF97316),
        RequestStatus.completed => const Color(0xFF10B981),
        RequestStatus.rejected  => const Color(0xFFEF4444),
        RequestStatus.cancelled => const Color(0xFF6B7280),
      };

  String get apiValue => name;
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
