import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../services/geocoding_service.dart';

class JourneyMapWidget extends StatefulWidget {
  const JourneyMapWidget({
    super.key,
    required this.fromCity,
    this.fromCountry = '',
    required this.toCity,
    this.toCountry = '',
    this.travelMeans = '',
    this.status = '',
    this.departureDate,
    this.arrivalDate,
  });

  final String fromCity;
  final String fromCountry;
  final String toCity;
  final String toCountry;
  final String travelMeans;
  final String status;
  final DateTime? departureDate;
  final DateTime? arrivalDate;

  @override
  State<JourneyMapWidget> createState() => _JourneyMapWidgetState();
}

class _JourneyMapWidgetState extends State<JourneyMapWidget>
    with TickerProviderStateMixin {
  final _mapController = MapController();
  AnimationController? _animCtrl;

  LatLng? _from;
  LatLng? _to;
  bool _loading = true;
  bool _error = false;
  bool _simulating = false;
  double _progress = 0.0;

  @override
  void initState() {
    super.initState();
    _geocode();
  }

  @override
  void didUpdateWidget(covariant JourneyMapWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.fromCity != widget.fromCity ||
        oldWidget.fromCountry != widget.fromCountry ||
        oldWidget.toCity != widget.toCity ||
        oldWidget.toCountry != widget.toCountry) {
      _geocode();
    }
  }

  @override
  void dispose() {
    _animCtrl?.dispose();
    super.dispose();
  }

  double _naturalProgress() {
    final s = widget.status.toLowerCase();
    if (s.contains('deliver') || s.contains('complet')) return 1.0;
    if (s == 'pending' || s == 'accepted') return 0.05;
    final dep = widget.departureDate;
    final arr = widget.arrivalDate;
    if (dep == null || arr == null) return 0.3;
    final now = DateTime.now();
    if (now.isBefore(dep)) return 0.0;
    if (now.isAfter(arr)) return 1.0;
    final total = arr.difference(dep).inMilliseconds;
    if (total <= 0) return 0.5;
    return (now.difference(dep).inMilliseconds / total).clamp(0.0, 1.0);
  }

  ({String city, String country}) _normalizedLocation(
      String rawCity, String rawCountry) {
    final parsed = GeocodingService.parseCityCountry(rawCity);
    final city = parsed.city.isNotEmpty ? parsed.city : rawCity.trim();
    final country =
        rawCountry.trim().isNotEmpty ? rawCountry.trim() : parsed.country;
    return (city: city, country: country);
  }

  Future<void> _geocode() async {
    setState(() {
      _loading = true;
      _error = false;
    });
    final g = GeocodingService.instance;
    final fromLocation =
        _normalizedLocation(widget.fromCity, widget.fromCountry);
    final toLocation = _normalizedLocation(widget.toCity, widget.toCountry);

    LatLng? from = await g.geocode(fromLocation.city, fromLocation.country);
    from ??= await g.geocode(fromLocation.city);

    LatLng? to = await g.geocode(toLocation.city, toLocation.country);
    to ??= await g.geocode(toLocation.city);

    if (!mounted) return;
    if (from == null || to == null) {
      setState(() {
        _error = true;
        _loading = false;
      });
      return;
    }
    setState(() {
      _from = from;
      _to = to;
      _progress = _naturalProgress();
      _loading = false;
    });
    _fit();
  }

  void _fit() {
    if (_from == null || _to == null) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      try {
        _mapController.fitCamera(
          CameraFit.bounds(
            bounds: LatLngBounds.fromPoints([_from!, _to!]),
            padding: const EdgeInsets.all(60),
          ),
        );
      } catch (_) {}
    });
  }

  void _startSim() {
    _animCtrl?.dispose();
    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 14),
    )
      ..addListener(() => setState(() => _progress = _animCtrl!.value))
      ..addStatusListener((s) {
        if (s == AnimationStatus.completed) {
          setState(() => _simulating = false);
        }
      });
    setState(() {
      _simulating = true;
      _progress = 0;
    });
    _animCtrl!.forward(from: 0);
  }

  void _stopSim() {
    _animCtrl?.stop();
    setState(() {
      _simulating = false;
      _progress = _naturalProgress();
    });
  }

  LatLng _lerp(LatLng a, LatLng b, double t) => LatLng(
        a.latitude + (b.latitude - a.latitude) * t,
        a.longitude + (b.longitude - a.longitude) * t,
      );

  IconData get _modeIcon {
    final m = widget.travelMeans.toLowerCase();
    if (m.contains('air') ||
        m.contains('fly') ||
        m.contains('flight') ||
        m.contains('plane')) return Icons.flight;
    if (m.contains('sea') ||
        m.contains('ship') ||
        m.contains('water') ||
        m.contains('boat')) return Icons.directions_boat_rounded;
    if (m.contains('bus') || m.contains('coach')) {
      return Icons.directions_bus_rounded;
    }
    return Icons.local_shipping_rounded;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(children: [
          const Icon(Icons.map_outlined, size: 18, color: AppColors.primary),
          const SizedBox(width: 8),
          Text(
            'Journey Map',
            style: AppTextStyles.labelMd.copyWith(fontWeight: FontWeight.w700),
          ),
        ]),
        const SizedBox(height: 10),
        Container(
          height: 320,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.border),
          ),
          clipBehavior: Clip.hardEdge,
          child: _loading
              ? _buildLoading()
              : _error
                  ? _buildError()
                  : _buildMap(),
        ),
      ],
    );
  }

  Widget _buildLoading() => Container(
        color: AppColors.gray50,
        child: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(
                  strokeWidth: 2, color: AppColors.primary),
              SizedBox(height: 12),
              Text(
                'Loading map...',
                style: TextStyle(color: AppColors.gray500, fontSize: 13),
              ),
            ],
          ),
        ),
      );

  Widget _buildError() => Container(
        color: AppColors.gray100,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.map_outlined,
                    size: 48, color: AppColors.gray400),
                const SizedBox(height: 10),
                Text(
                  'Could not load map',
                  style:
                      AppTextStyles.labelMd.copyWith(color: AppColors.gray700),
                ),
                const SizedBox(height: 4),
                Text(
                  '${widget.fromCity} → ${widget.toCity}',
                  style:
                      AppTextStyles.bodySm.copyWith(color: AppColors.gray500),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                GestureDetector(
                  onTap: _geocode,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'Retry',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );

  Widget _buildMap() {
    final from = _from!;
    final to = _to!;
    final vehicle = _lerp(from, to, _progress);

    return Stack(
      children: [
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: _lerp(from, to, 0.5),
            initialZoom: 4,
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.deracali.boltexponativewind',
            ),
            PolylineLayer(
              polylines: [
                Polyline(
                  points: [from, to],
                  strokeWidth: 3.5,
                  color: AppColors.primary.withOpacity(0.65),
                ),
              ],
            ),
            MarkerLayer(
              markers: [
                _dotMarker(from, AppColors.success),
                _pinMarker(to, AppColors.error),
                _vehicleMarker(vehicle),
              ],
            ),
            RichAttributionWidget(
              attributions: [
                TextSourceAttribution('© OpenStreetMap contributors'),
              ],
            ),
          ],
        ),
        _overlayControls(),
      ],
    );
  }

  Marker _dotMarker(LatLng point, Color color) => Marker(
        point: point,
        width: 18,
        height: 18,
        child: Container(
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2.5),
            boxShadow: [
              BoxShadow(
                  color: color.withOpacity(0.4), blurRadius: 4, spreadRadius: 1)
            ],
          ),
        ),
      );

  Marker _pinMarker(LatLng point, Color color) => Marker(
        point: point,
        width: 30,
        height: 30,
        child: Icon(Icons.location_on, color: color, size: 30),
      );

  Marker _vehicleMarker(LatLng point) => Marker(
        point: point,
        width: 40,
        height: 40,
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.primary,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withOpacity(0.45),
                blurRadius: 10,
                spreadRadius: 2,
              ),
            ],
          ),
          child: Icon(_modeIcon, size: 20, color: Colors.white),
        ),
      );

  Widget _overlayControls() {
    return Stack(
      children: [
        // Zoom controls
        Positioned(
          right: 10,
          top: 10,
          child: Column(
            children: [
              _iconBtn(Icons.add, () {
                try {
                  _mapController.move(
                    _mapController.camera.center,
                    _mapController.camera.zoom + 1,
                  );
                } catch (_) {}
              }),
              const SizedBox(height: 4),
              _iconBtn(Icons.remove, () {
                try {
                  _mapController.move(
                    _mapController.camera.center,
                    _mapController.camera.zoom - 1,
                  );
                } catch (_) {}
              }),
              const SizedBox(height: 4),
              _iconBtn(Icons.fit_screen_rounded, _fit),
            ],
          ),
        ),
        // Simulate button
        Positioned(
          left: 10,
          bottom: 28,
          child: GestureDetector(
            onTap: _simulating ? _stopSim : _startSim,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              decoration: BoxDecoration(
                color: _simulating ? AppColors.error : AppColors.primary,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.2),
                    blurRadius: 6,
                  )
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    _simulating ? Icons.stop_rounded : Icons.play_arrow_rounded,
                    color: Colors.white,
                    size: 15,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _simulating ? 'Stop' : 'Simulate journey',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        // Progress badge
        Positioned(
          right: 10,
          bottom: 28,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.55),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              '${(_progress * 100).toInt()}%',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _iconBtn(IconData icon, VoidCallback onTap) => GestureDetector(
        onTap: onTap,
        child: Container(
          width: 30,
          height: 30,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(6),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.15),
                blurRadius: 4,
              )
            ],
          ),
          child: Icon(icon, size: 16, color: AppColors.gray700),
        ),
      );
}
