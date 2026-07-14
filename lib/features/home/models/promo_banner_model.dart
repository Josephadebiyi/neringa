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

  factory PromoBanner.fromJson(Map<String, dynamic> j) {
    final sort = j['sortOrder'] ?? j['sort_order'];
    return PromoBanner(
      id: j['id']?.toString() ?? '',
      title: j['title']?.toString() ?? '',
      imageUrl:
          (j['imageUrl'] ?? j['image_url'] ?? j['image'])?.toString() ?? '',
      linkUrl: (j['linkUrl'] ?? j['link_url'])?.toString(),
      sortOrder: sort is num ? sort.toInt() : 0,
    );
  }
}
