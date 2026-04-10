import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../../shared/widgets/bago_page_scaffold.dart';
import '../models/conversation_model.dart';
import '../providers/message_provider.dart';

class MessagesScreen extends ConsumerStatefulWidget {
  const MessagesScreen({super.key});

  @override
  ConsumerState<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends ConsumerState<MessagesScreen> {
  late final TextEditingController _searchCtrl;
  late final FocusNode _searchFocus;

  @override
  void initState() {
    super.initState();
    _searchCtrl = TextEditingController();
    _searchFocus = FocusNode();
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => ref.read(messageProvider.notifier).loadConversations(),
    );
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(messageProvider);
    final query = state.searchQuery.trim().toLowerCase();
    final conversations = query.isEmpty
        ? state.conversations
        : state.conversations.where((conv) {
            final haystack = [
              conv.otherUserName,
              conv.lastMessage ?? '',
              conv.requestStatus ?? '',
              conv.tripId ?? '',
              conv.requestId ?? '',
            ].join(' ').toLowerCase();
            return haystack.contains(query);
          }).toList();

    return Scaffold(
      backgroundColor: AppColors.white,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 18, 24, 18),
              child: Row(
                children: [
                  Text(
                    'Messages',
                    style: AppTextStyles.displaySm.copyWith(
                      color: AppColors.black,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.gray100,
                      borderRadius: BorderRadius.circular(22),
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.search_rounded, color: AppColors.black),
                      onPressed: () => _searchFocus.requestFocus(),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 14),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.gray100,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: TextField(
                  controller: _searchCtrl,
                  focusNode: _searchFocus,
                  onChanged: ref.read(messageProvider.notifier).setSearchQuery,
                  textInputAction: TextInputAction.search,
                  style: AppTextStyles.bodyMd.copyWith(color: AppColors.black),
                  decoration: InputDecoration(
                    hintText: 'Search chats, names, or routes',
                    hintStyle: AppTextStyles.bodyMd.copyWith(color: AppColors.gray500),
                    prefixIcon: const Icon(Icons.search_rounded, color: AppColors.gray500),
                    suffixIcon: state.searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.close_rounded, color: AppColors.gray500),
                            onPressed: () {
                              _searchCtrl.clear();
                              ref.read(messageProvider.notifier).clearSearchQuery();
                            },
                          )
                        : null,
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),
              ),
            ),
            Expanded(
              child: state.isLoading
                  ? const Center(child: AppLoading())
                  : RefreshIndicator(
                      onRefresh: () =>
                          ref.read(messageProvider.notifier).loadConversations(),
                      child: ListView(
                        padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                        children: [
                          const BagoInfoBanner(
                            icon: Icons.verified_user_outlined,
                            message:
                                'Chat safely by staying within Bago. We protect your payments and data.',
                          ),
                          const SizedBox(height: 28),
                          if (conversations.isEmpty)
                            BagoEmptyState(
                              icon: Icons.chat_bubble_outline_rounded,
                              title: state.searchQuery.isEmpty
                                  ? 'No messages yet'
                                  : 'No results found',
                              subtitle: state.searchQuery.isEmpty
                                  ? 'When you contact a carrier or sender, your chats will appear here.'
                                  : 'Try searching by name, message, request, or route.',
                            )
                          else
                            ...conversations.map(
                              (c) => _ConversationTile(conv: c),
                            ),
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ConversationTile extends StatelessWidget {
  const _ConversationTile({required this.conv});
  final ConversationModel conv;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      onTap: () => context.push('/messages/${conv.id}'),
      contentPadding: const EdgeInsets.symmetric(horizontal: 0, vertical: 8),
      leading: CircleAvatar(
        radius: 30,
        backgroundColor: AppColors.gray100,
        child: conv.otherUserAvatar != null
            ? ClipOval(
                child: CachedNetworkImage(
                  imageUrl: conv.otherUserAvatar!,
                  width: 60,
                  height: 60,
                  fit: BoxFit.cover,
                  errorWidget: (_, __, ___) => Center(
                    child: Text(
                      conv.initials,
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                ),
              )
            : Center(
                child: Text(
                  conv.initials,
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
              ),
      ),
      title: Text(
        conv.otherUserName,
        style: AppTextStyles.labelMd.copyWith(
          color: AppColors.black,
          fontWeight: FontWeight.w800,
        ),
      ),
      subtitle: conv.lastMessage != null
          ? Text(
              conv.lastMessage!,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTextStyles.bodySm.copyWith(
                color: conv.unreadCount > 0 ? AppColors.black : AppColors.gray500,
                fontWeight: conv.unreadCount > 0
                    ? FontWeight.w700
                    : FontWeight.normal,
              ),
            )
          : null,
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (conv.lastMessageTime != null)
            Text(
              _timeLabel(conv.lastMessageTime!),
              style: AppTextStyles.captionBold.copyWith(color: AppColors.gray500),
            ),
          if (conv.unreadCount > 0) ...[
            const SizedBox(height: 6),
            Container(
              width: 20,
              height: 20,
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  '${conv.unreadCount}',
                  style: AppTextStyles.labelXs.copyWith(
                    color: AppColors.white,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _timeLabel(String raw) {
    try {
      final dt = DateTime.parse(raw).toLocal();
      final now = DateTime.now();
      final diff = now.difference(dt);
      if (diff.inMinutes < 60) return '${diff.inMinutes}m';
      if (diff.inHours < 24) return '${diff.inHours}h';
      return '${dt.day}/${dt.month}';
    } catch (_) {
      return '';
    }
  }
}
