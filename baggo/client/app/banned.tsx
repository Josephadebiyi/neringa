import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ban, CircleAlert as AlertCircle } from 'lucide-react-native';

export default function BannedUserScreen() {

  return (
    <View style={[styles.container, { backgroundColor: '#F8F6F3' }]}>
      <LinearGradient
        colors={['#5845D8', '#4534B8']}
        style={styles.header}
      >
        <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Account Status</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.banCard, { backgroundColor: '#FFFFFF' }]}>
          <Ban size={48} color={'#5845D8'} />
          <Text style={[styles.banTitle, { color: '#1A1A1A' }]}>Account Banned</Text>
          <Text style={[styles.banMessage, { color: '#1A1A1A' }]}>
            If you're seeing this screen, your account has been banned.
          </Text>
          <Text style={[styles.banDetails, { color: '#6B6B6B' }]}>
            For more information or to appeal this decision, please contact our support team at{' '}
            <Text style={[styles.emailText, { color: '#5845D8' }]}>bggo@mail.com</Text>.
          </Text>
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: '#5845D8' }]}
            onPress={() => {
              alert('Please email bggo@mail.com for support.');
            }}
          >
            <Text style={[styles.contactButtonText, { color: '#FFFFFF' }]}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoCard, { backgroundColor: '#FDF9F1', borderLeftColor: '#5845D8' }]}>
          <AlertCircle size={20} color={'#5845D8'} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: '#1A1A1A' }]}>Important Notice</Text>
            <Text style={[styles.infoText, { color: '#6B6B6B' }]}>
              Our team is committed to maintaining a safe and compliant platform. If you believe this ban is an error, please reach out to support for assistance.
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  banCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  banTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  banMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  banDetails: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  emailText: {
    fontWeight: '600',
  },
  contactButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
