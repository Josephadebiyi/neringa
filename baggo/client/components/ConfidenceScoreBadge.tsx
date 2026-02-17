import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react-native';

interface ConfidenceScoreBadgeProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export default function ConfidenceScoreBadge({ 
  score, 
  size = 'medium',
  showLabel = true 
}: ConfidenceScoreBadgeProps) {
  const { colors } = useTheme();

  const getScoreColor = () => {
    if (score >= 80) return colors.success;
    if (score >= 60) return '#84CC16';
    if (score >= 40) return colors.warning;
    if (score >= 20) return '#F97316';
    return colors.error;
  };

  const getScoreLabel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Risky';
    return 'High Risk';
  };

  const getIcon = () => {
    const iconSize = size === 'small' ? 12 : size === 'medium' ? 14 : 16;
    if (score >= 60) return <CheckCircle size={iconSize} color={getScoreColor()} />;
    if (score >= 40) return <Shield size={iconSize} color={getScoreColor()} />;
    return <AlertTriangle size={iconSize} color={getScoreColor()} />;
  };

  const sizeStyles = {
    small: {
      container: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
      score: { fontSize: 12 },
      label: { fontSize: 9 }
    },
    medium: {
      container: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
      score: { fontSize: 16 },
      label: { fontSize: 10 }
    },
    large: {
      container: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
      score: { fontSize: 20 },
      label: { fontSize: 12 }
    }
  };

  const currentSize = sizeStyles[size];
  const scoreColor = getScoreColor();

  return (
    <View 
      style={[
        styles.container, 
        currentSize.container,
        { backgroundColor: `${scoreColor}15`, borderColor: `${scoreColor}40` }
      ]}
    >
      <View style={styles.row}>
        {getIcon()}
        <Text style={[styles.score, currentSize.score, { color: scoreColor }]}>
          {score}
        </Text>
      </View>
      {showLabel && (
        <Text style={[styles.label, currentSize.label, { color: scoreColor }]}>
          {getScoreLabel()}
        </Text>
      )}
    </View>
  );
}

interface CompatibilityBadgeProps {
  status: 'Yes' | 'No' | 'Conditional';
  size?: 'small' | 'medium';
}

export function CompatibilityBadge({ status, size = 'small' }: CompatibilityBadgeProps) {
  const { colors } = useTheme();

  const getStatusColor = () => {
    if (status === 'Yes') return colors.success;
    if (status === 'Conditional') return colors.warning;
    return colors.error;
  };

  const getStatusLabel = () => {
    if (status === 'Yes') return 'Compatible';
    if (status === 'Conditional') return 'Conditional';
    return 'Not Compatible';
  };

  const statusColor = getStatusColor();
  const isSmall = size === 'small';

  return (
    <View 
      style={[
        styles.compatBadge,
        { 
          backgroundColor: `${statusColor}15`, 
          borderColor: `${statusColor}40`,
          paddingHorizontal: isSmall ? 8 : 12,
          paddingVertical: isSmall ? 4 : 6,
        }
      ]}
    >
      <Text style={[
        styles.compatText, 
        { color: statusColor, fontSize: isSmall ? 11 : 13 }
      ]}>
        {getStatusLabel()}
      </Text>
    </View>
  );
}

interface RiskBadgeProps {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  size?: 'small' | 'medium';
}

export function RiskBadge({ level, size = 'small' }: RiskBadgeProps) {
  const { colors } = useTheme();

  const getLevelColor = () => {
    if (level === 'LOW') return colors.success;
    if (level === 'MEDIUM') return colors.warning;
    if (level === 'HIGH') return '#F97316';
    return colors.error;
  };

  const getLevelLabel = () => {
    if (level === 'LOW') return 'Low Risk';
    if (level === 'MEDIUM') return 'Medium Risk';
    if (level === 'HIGH') return 'High Risk';
    return 'Very High Risk';
  };

  const levelColor = getLevelColor();
  const isSmall = size === 'small';

  return (
    <View 
      style={[
        styles.riskBadge,
        { 
          backgroundColor: `${levelColor}15`, 
          borderColor: `${levelColor}40`,
          paddingHorizontal: isSmall ? 8 : 12,
          paddingVertical: isSmall ? 4 : 6,
        }
      ]}
    >
      <AlertTriangle size={isSmall ? 10 : 12} color={levelColor} />
      <Text style={[
        styles.riskText, 
        { color: levelColor, fontSize: isSmall ? 10 : 12 }
      ]}>
        {getLevelLabel()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  score: {
    fontWeight: 'bold',
  },
  label: {
    fontWeight: '500',
    marginTop: 2,
  },
  compatBadge: {
    borderWidth: 1,
    borderRadius: 6,
  },
  compatText: {
    fontWeight: '600',
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 6,
  },
  riskText: {
    fontWeight: '600',
  },
});
