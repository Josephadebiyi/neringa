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
