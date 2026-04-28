class PromoBanner {
  const PromoBanner({
    required this.id,
    required this.title,
    required this.imageUrl,
    this.linkUrl,
    this.sortOrder = 0,
  });

  final String id;
  final String title;
  final String imageUrl;
  final String? linkUrl;
  final int sortOrder;

  factory PromoBanner.fromJson(Map<String, dynamic> j) => PromoBanner(
        id: j['id']?.toString() ?? '',
        title: j['title']?.toString() ?? '',
        imageUrl: j['imageUrl']?.toString() ?? '',
        linkUrl: j['linkUrl']?.toString(),
        sortOrder: (j['sortOrder'] as num?)?.toInt() ?? 0,
      );
}
