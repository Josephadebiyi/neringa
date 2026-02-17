import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Package, 
  Truck,
  Clock,
  DollarSign,
  Download,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { assessShipment, downloadCustomsPDF, AssessmentResult } from '@/utils/shipmentAssessment';

interface ShipmentAssessmentProps {
  tripId: string;
  item: {
    type: string;
    category: string;
    value: number;
    quantity: number;
    weight: number;
    dimensions?: { length: number; width: number; height: number };
  };
  onClose: () => void;
  onProceed?: (assessment: any) => void;
}

export default function ShipmentAssessment({ 
  tripId, 
  item, 
  onClose,
  onProceed 
}: ShipmentAssessmentProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<AssessmentResult['assessment'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    risks: true,
    customs: false,
    requirements: false,
    price: false
  });

  useEffect(() => {
    runAssessment();
  }, [tripId, item]);

  const runAssessment = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await assessShipment(tripId, item);
      if (result.success) {
        setAssessment(result.assessment);
      } else {
        setError(result.message || 'Assessment failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to assess shipment');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!assessment?.declarationData) return;
    
    try {
      setDownloadingPDF(true);
      await downloadCustomsPDF(assessment.declarationData);
      Alert.alert('Success', 'Customs declaration PDF downloaded successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to download PDF');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return '#84CC16';
    if (score >= 40) return colors.warning;
    if (score >= 20) return '#F97316';
    return colors.error;
  };

  const getRiskColor = (risk: number) => {
    if (risk < 25) return colors.success;
    if (risk < 50) return colors.warning;
    if (risk < 75) return '#F97316';
    return colors.error;
  };

  const getCompatibilityColor = (status: string) => {
    if (status === 'Yes') return colors.success;
    if (status === 'Conditional') return colors.warning;
    return colors.error;
  };

  const getCompatibilityIcon = (status: string) => {
    if (status === 'Yes') return <CheckCircle size={24} color={colors.success} />;
    if (status === 'Conditional') return <AlertTriangle size={24} color={colors.warning} />;
    return <XCircle size={24} color={colors.error} />;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Analyzing shipment...
          </Text>
          <Text style={[styles.loadingSubtext, { color: colors.textLight }]}>
            Checking customs, risks, and compatibility
          </Text>
        </View>
      </View>
    );
  }

  if (error || !assessment) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <XCircle size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            Assessment Failed
          </Text>
          <Text style={[styles.errorSubtext, { color: colors.textLight }]}>
            {error || 'Unable to assess shipment'}
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={runAssessment}
          >
            <Text style={[styles.retryButtonText, { color: colors.textInverse }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Shipment Assessment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Confidence Score */}
        <View style={[styles.scoreCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.scoreLabel, { color: colors.textLight }]}>
            Delivery Confidence Score
          </Text>
          <Text style={[styles.scoreValue, { color: getScoreColor(assessment.confidenceScore) }]}>
            {assessment.confidenceScore}
          </Text>
          <View style={styles.scoreBar}>
            <View 
              style={[
                styles.scoreBarFill, 
                { 
                  width: `${assessment.confidenceScore}%`,
                  backgroundColor: getScoreColor(assessment.confidenceScore)
                }
              ]} 
            />
          </View>
        </View>

        {/* Compatibility Status */}
        <View style={[styles.compatCard, { backgroundColor: colors.card }]}>
          <View style={styles.compatHeader}>
            {getCompatibilityIcon(assessment.compatibility.status)}
            <View style={styles.compatInfo}>
              <Text style={[styles.compatTitle, { color: colors.text }]}>
                Shipment Compatibility
              </Text>
              <Text style={[
                styles.compatStatus, 
                { color: getCompatibilityColor(assessment.compatibility.status) }
              ]}>
                {assessment.compatibility.status}
              </Text>
            </View>
          </View>
          {assessment.compatibility.reasons.length > 0 && (
            <View style={styles.reasonsList}>
              {assessment.compatibility.reasons.map((reason, index) => (
                <Text key={index} style={[styles.reasonText, { color: colors.textLight }]}>
                  • {reason}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Risk Classification */}
        <TouchableOpacity 
          style={[styles.section, { backgroundColor: colors.card }]}
          onPress={() => toggleSection('risks')}
        >
          <View style={styles.sectionHeader}>
            <AlertTriangle size={20} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Risk Classification</Text>
            {expandedSections.risks ? 
              <ChevronUp size={20} color={colors.textLight} /> : 
              <ChevronDown size={20} color={colors.textLight} />
            }
          </View>
          
          {expandedSections.risks && (
            <View style={styles.sectionContent}>
              <View style={[styles.overallRisk, { backgroundColor: colors.backgroundLight }]}>
                <Text style={[styles.overallRiskLabel, { color: colors.textLight }]}>Overall Risk</Text>
                <Text style={[
                  styles.overallRiskValue, 
                  { color: assessment.riskClassification.overall === 'LOW' ? colors.success : 
                           assessment.riskClassification.overall === 'MEDIUM' ? colors.warning : colors.error }
                ]}>
                  {assessment.riskClassification.overall}
                </Text>
              </View>
              
              <RiskBar 
                label="Border/Customs Risk" 
                value={assessment.riskClassification.borderCustomsRisk} 
                colors={colors}
              />
              <RiskBar 
                label="Delay Risk" 
                value={assessment.riskClassification.delayRisk} 
                colors={colors}
              />
              <RiskBar 
                label="Damage Risk" 
                value={assessment.riskClassification.damageRisk} 
                colors={colors}
              />
              <RiskBar 
                label="Confiscation Risk" 
                value={assessment.riskClassification.confiscationRisk} 
                colors={colors}
              />
            </View>
          )}
        </TouchableOpacity>

        {/* Customs Information */}
        <TouchableOpacity 
          style={[styles.section, { backgroundColor: colors.card }]}
          onPress={() => toggleSection('customs')}
        >
          <View style={styles.sectionHeader}>
            <Shield size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Customs Information</Text>
            {expandedSections.customs ? 
              <ChevronUp size={20} color={colors.textLight} /> : 
              <ChevronDown size={20} color={colors.textLight} />
            }
          </View>
          
          {expandedSections.customs && (
            <View style={styles.sectionContent}>
              <InfoRow label="HS Code" value={assessment.customs.hsCode} colors={colors} />
              <InfoRow label="Category" value={assessment.customs.hsDescription} colors={colors} />
              <InfoRow 
                label="Estimated Duty" 
                value={`${assessment.customs.estimatedDuty.toFixed(2)}`} 
                colors={colors} 
              />
              <InfoRow 
                label="Estimated VAT" 
                value={`${assessment.customs.estimatedVAT.toFixed(2)}`} 
                colors={colors} 
              />
              <InfoRow 
                label="Total Taxes" 
                value={`${assessment.customs.totalTaxes.toFixed(2)}`} 
                colors={colors}
                highlight
              />
              
              {assessment.customs.requiredDocuments.length > 0 && (
                <View style={styles.documentsSection}>
                  <Text style={[styles.documentsTitle, { color: colors.text }]}>
                    Required Documents:
                  </Text>
                  {assessment.customs.requiredDocuments.map((doc, index) => (
                    <Text key={index} style={[styles.documentItem, { color: colors.textLight }]}>
                      • {doc.replace(/_/g, ' ')}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* Requirements */}
        <TouchableOpacity 
          style={[styles.section, { backgroundColor: colors.card }]}
          onPress={() => toggleSection('requirements')}
        >
          <View style={styles.sectionHeader}>
            <Package size={20} color={colors.secondary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Requirements</Text>
            {expandedSections.requirements ? 
              <ChevronUp size={20} color={colors.textLight} /> : 
              <ChevronDown size={20} color={colors.textLight} />
            }
          </View>
          
          {expandedSections.requirements && (
            <View style={styles.sectionContent}>
              {assessment.requirements.packaging.length > 0 && (
                <RequirementGroup 
                  title="Packaging" 
                  items={assessment.requirements.packaging} 
                  colors={colors} 
                />
              )}
              {assessment.requirements.labeling.length > 0 && (
                <RequirementGroup 
                  title="Labeling" 
                  items={assessment.requirements.labeling} 
                  colors={colors} 
                />
              )}
              {assessment.requirements.declaration.length > 0 && (
                <RequirementGroup 
                  title="Declaration" 
                  items={assessment.requirements.declaration} 
                  colors={colors} 
                />
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* Price Estimate */}
        <TouchableOpacity 
          style={[styles.section, { backgroundColor: colors.card }]}
          onPress={() => toggleSection('price')}
        >
          <View style={styles.sectionHeader}>
            <DollarSign size={20} color={colors.success} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Price Suggestion</Text>
            {expandedSections.price ? 
              <ChevronUp size={20} color={colors.textLight} /> : 
              <ChevronDown size={20} color={colors.textLight} />
            }
          </View>
          
          {expandedSections.price && (
            <View style={styles.sectionContent}>
              <InfoRow 
                label="Base Price" 
                value={`€${assessment.priceEstimate.basePrice.toFixed(2)}`} 
                colors={colors} 
              />
              <InfoRow 
                label="Risk Premium" 
                value={`€${assessment.priceEstimate.riskPremium.toFixed(2)}`} 
                colors={colors} 
              />
              <InfoRow 
                label="Urgency Premium" 
                value={`€${assessment.priceEstimate.urgencyPremium.toFixed(2)}`} 
                colors={colors} 
              />
              <View style={[styles.totalPrice, { backgroundColor: colors.backgroundLight }]}>
                <Text style={[styles.totalPriceLabel, { color: colors.text }]}>
                  Suggested Total
                </Text>
                <Text style={[styles.totalPriceValue, { color: colors.primary }]}>
                  €{assessment.priceEstimate.totalPrice.toFixed(2)}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.downloadButton, { backgroundColor: colors.backgroundLight, borderColor: colors.primary }]}
            onPress={handleDownloadPDF}
            disabled={downloadingPDF}
          >
            {downloadingPDF ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Download size={20} color={colors.primary} />
                <Text style={[styles.downloadButtonText, { color: colors.primary }]}>
                  Download Customs PDF
                </Text>
              </>
            )}
          </TouchableOpacity>

          {assessment.compatibility.status !== 'No' && onProceed && (
            <TouchableOpacity 
              style={[styles.proceedButton, { backgroundColor: colors.primary }]}
              onPress={() => onProceed(assessment)}
            >
              <Text style={[styles.proceedButtonText, { color: colors.textInverse }]}>
                Proceed with Booking
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// Helper Components
function RiskBar({ label, value, colors }: { label: string; value: number; colors: any }) {
  const getRiskColor = (risk: number) => {
    if (risk < 25) return colors.success;
    if (risk < 50) return colors.warning;
    if (risk < 75) return '#F97316';
    return colors.error;
  };

  return (
    <View style={styles.riskItem}>
      <View style={styles.riskLabelRow}>
        <Text style={[styles.riskLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.riskValue, { color: getRiskColor(value) }]}>{value}%</Text>
      </View>
      <View style={[styles.riskBar, { backgroundColor: colors.border }]}>
        <View 
          style={[
            styles.riskBarFill, 
            { width: `${value}%`, backgroundColor: getRiskColor(value) }
          ]} 
        />
      </View>
    </View>
  );
}

function InfoRow({ label, value, colors, highlight }: { 
  label: string; 
  value: string; 
  colors: any;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.infoRow, highlight && { backgroundColor: colors.backgroundLight, padding: 12, borderRadius: 8 }]}>
      <Text style={[styles.infoLabel, { color: colors.textLight }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: highlight ? colors.primary : colors.text }]}>{value}</Text>
    </View>
  );
}

function RequirementGroup({ title, items, colors }: { 
  title: string; 
  items: string[]; 
  colors: any 
}) {
  return (
    <View style={styles.requirementGroup}>
      <Text style={[styles.requirementTitle, { color: colors.text }]}>{title}</Text>
      {items.map((item, index) => (
        <Text key={index} style={[styles.requirementItem, { color: colors.textLight }]}>
          • {item}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scoreCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  scoreBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5E5',
    marginTop: 16,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  compatCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  compatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compatInfo: {
    marginLeft: 12,
    flex: 1,
  },
  compatTitle: {
    fontSize: 14,
  },
  compatStatus: {
    fontSize: 18,
    fontWeight: '600',
  },
  reasonsList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  reasonText: {
    fontSize: 13,
    marginBottom: 4,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  sectionContent: {
    marginTop: 16,
  },
  overallRisk: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  overallRiskLabel: {
    fontSize: 14,
  },
  overallRiskValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  riskItem: {
    marginBottom: 12,
  },
  riskLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  riskLabel: {
    fontSize: 13,
  },
  riskValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  riskBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  riskBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  documentsSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  documentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  documentItem: {
    fontSize: 13,
    marginBottom: 4,
  },
  requirementGroup: {
    marginBottom: 16,
  },
  requirementTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  requirementItem: {
    fontSize: 13,
    marginBottom: 4,
  },
  totalPrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  totalPriceLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalPriceValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  actions: {
    marginTop: 16,
    gap: 12,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  proceedButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
