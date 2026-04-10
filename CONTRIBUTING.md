# Contributing to Bago Platform

Thank you for your interest in contributing to Bago! We welcome contributions from the community.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and constructive in all interactions.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/bago-platform.git
   cd bago-platform
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/original-owner/bago-platform.git
   ```
4. **Install dependencies**:
   ```bash
   npm run install:all
   ```
5. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

1. **Keep your fork updated**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Make your changes** in your feature branch

3. **Test thoroughly**:
   ```bash
   npm test
   npm run lint
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

## Pull Request Process

1. **Update the README.md** with details of changes if applicable
2. **Add tests** for new features
3. **Ensure CI/CD passes** all checks
4. **Request review** from maintainers
5. **Address review feedback** promptly
6. **Squash commits** before merge if requested

### PR Title Format

Use conventional commits format:
- `feat: add new feature`
- `fix: resolve bug in payment`
- `docs: update API documentation`
- `style: format code`
- `refactor: restructure user service`
- `test: add payment tests`
- `chore: update dependencies`

## Coding Standards

### JavaScript/TypeScript

- Use **ES6+** syntax
- Follow **ESLint** rules
- Use **meaningful variable names**
- Add **JSDoc comments** for functions
- Keep functions **small and focused**

Example:
```javascript
/**
 * Calculate total price including fees
 * @param {number} basePrice - Base price of item
 * @param {number} feeRate - Fee rate as decimal
 * @returns {number} Total price with fees
 */
function calculateTotalPrice(basePrice, feeRate) {
  return basePrice * (1 + feeRate);
}
```

### React Components

- Use **functional components** with hooks
- Follow **component composition** patterns
- Use **descriptive prop names**
- Add **PropTypes** or **TypeScript** types

Example:
```jsx
import React from 'react';

/**
 * UserCard - Display user information
 */
export const UserCard = ({ name, email, avatar }) => {
  return (
    <div className="user-card">
      <img src={avatar} alt={name} />
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  );
};
```

### CSS/Styling

- Use **TailwindCSS** utility classes
- Follow **mobile-first** approach
- Keep styles **modular**

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting)
- **refactor**: Code refactoring
- **test**: Adding/updating tests
- **chore**: Maintenance tasks

### Examples

```
feat(auth): add Google OAuth login

Implemented Google OAuth 2.0 authentication flow
- Added OAuth button to login page
- Created Google auth strategy
- Updated user model to store OAuth tokens

Closes #123
```

```
fix(payment): resolve Stripe webhook timeout

Fixed webhook handler timeout by implementing async processing
- Added job queue for payment processing
- Increased webhook timeout to 30s

Fixes #456
```

## Areas for Contribution

We especially welcome contributions in:

- 🐛 **Bug fixes** - Check open issues
- 📚 **Documentation** - Improve README, add tutorials
- 🧪 **Tests** - Increase test coverage
- ♿ **Accessibility** - Improve a11y features
- 🌐 **Internationalization** - Add translations
- 🎨 **UI/UX** - Design improvements
- ⚡ **Performance** - Optimization efforts

## Questions?

Feel free to:
- Open an issue for questions
- Join our Discord community
- Email us at dev@sendwithbago.com

Thank you for contributing to Bago! 🎉
