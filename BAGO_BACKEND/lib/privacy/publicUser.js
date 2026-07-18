export function abbreviateLastName(lastName) {
  const value = String(lastName || '').trim();
  if (!value) return '';
  return `${value.charAt(0).toUpperCase()}.`;
}

export function publicFirstName(firstName) {
  return String(firstName || '').trim();
}

export function publicDisplayName(firstName, lastName, fallback = 'User') {
  const first = publicFirstName(firstName);
  const last = abbreviateLastName(lastName);
  return [first, last].filter(Boolean).join(' ') || fallback;
}

export function maskPublicUserName(user, fallback = 'User') {
  if (!user || typeof user !== 'object') return user;
  const accountType = user.accountType ?? user.account_type ?? 'individual';
  if (accountType === 'company') {
    const tradingName = String(
      user.tradingName ?? user.trading_name ?? user.companyName ?? user.company_name ?? fallback,
    ).trim() || fallback;
    return {
      ...user,
      accountType: 'company',
      firstName: tradingName,
      lastName: '',
      first_name: user.first_name === undefined ? undefined : tradingName,
      last_name: user.last_name === undefined ? undefined : '',
      name: tradingName,
      fullName: tradingName,
      companyName: user.companyName ?? user.company_name ?? tradingName,
      tradingName,
    };
  }
  const firstName = publicFirstName(user.firstName ?? user.first_name);
  const lastName = abbreviateLastName(user.lastName ?? user.last_name);
  return {
    ...user,
    firstName,
    lastName,
    first_name: user.first_name === undefined ? undefined : firstName,
    last_name: user.last_name === undefined ? undefined : lastName,
    name: publicDisplayName(firstName, lastName, fallback),
    fullName: publicDisplayName(firstName, lastName, fallback),
  };
}
