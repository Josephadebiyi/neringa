# Changelog

All notable changes to the Bago Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Root-level package.json with unified scripts
- Docker Compose for multi-service orchestration
- Startup scripts for one-command launch
- Comprehensive README with setup instructions
- Contributing guidelines
- MIT License
- Environment variable examples
- Currency exchange API with multiple fallback providers

### Changed
- Restructured project for better organization
- Improved currency converter with API failover
- Updated gitignore to include all common patterns

### Fixed
- Currency exchange API errors (switched to reliable providers)
- Fixed `.get()` method calls in currency converter (now uses object notation)

### Removed
- Archived duplicate admin directories (BAGO_ADMIN, ADMIN_NEW 2)
- Archived old documentation and backup files

## [1.0.0] - 2024-03-XX

### Initial Release
- Backend API with Express.js and MongoDB
- React web application
- React Native mobile app (iOS & Android)
- Admin panel for platform management
- Stripe and Paystack payment integration
- DIDIT.me KYC verification
- Real-time messaging with Socket.IO
- Cloudinary image uploads
- Email notifications with Resend
- Multi-currency support
- Real-time tracking
- Insurance coverage options

---

## Types of Changes

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes
