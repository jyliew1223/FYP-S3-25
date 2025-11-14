// GoClimb/src/screens/PaymentScreen.js

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { API_ENDPOINTS } from '../constants/api';
import { STRIPE_CONFIG } from '../config/stripe';

export default function PaymentScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { confirmPayment } = useStripe();
  
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' or 'paynow'
  const [cardComplete, setCardComplete] = useState(false);
  const [toast, setToast] = useState('');
  const toastRef = useRef(null);

  function showToast(msg, durationMs = 2000) {
    setToast(msg);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(''), durationMs);
  }

  const handleCardPayment = async () => {
    if (!cardComplete) {
      showToast('Please enter complete card details');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create payment intent on backend
      const url = `${API_ENDPOINTS.BASE_URL}/${API_ENDPOINTS.PAYMENT.CREATE_PAYMENT_INTENT}`;
      console.log('[PaymentScreen] Calling:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: STRIPE_CONFIG.MEMBERSHIP_AMOUNT_SGD,
          currency: STRIPE_CONFIG.CURRENCY_SGD,
          paymentMethodTypes: ['card'],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('[PaymentScreen] Backend error:', response.status, errorText);
        showToast(`Backend error: ${response.status}. Check backend logs.`);
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.error || !data.clientSecret) {
        showToast(data.error || 'Failed to initialize payment');
        setLoading(false);
        return;
      }

      // Step 2: Confirm payment with Stripe
      const { paymentIntent, error: confirmError } = await confirmPayment(data.clientSecret, {
        paymentMethodType: 'Card',
      });

      if (confirmError) {
        showToast(confirmError.message);
        setLoading(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'Succeeded') {
        // Payment successful!
        showToast('Payment successful!', 1500);
        setTimeout(() => {
          navigation.replace('SignUp', { paid: true, paymentId: paymentIntent.id });
        }, 1500);
      }
    } catch (error) {
      console.log('[PaymentScreen] Card payment error:', error);
      if (error.message === 'Network request failed') {
        showToast('Backend not available. Payment endpoint not implemented yet.');
      } else {
        showToast('An error occurred during payment');
      }
    }

    setLoading(false);
  };

  const handlePayNowPayment = async () => {
    setLoading(true);

    try {
      // Step 1: Create payment intent for PayNow
      const url = `${API_ENDPOINTS.BASE_URL}/${API_ENDPOINTS.PAYMENT.CREATE_PAYMENT_INTENT}`;
      console.log('[PaymentScreen] Calling:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: STRIPE_CONFIG.MEMBERSHIP_AMOUNT_SGD,
          currency: STRIPE_CONFIG.CURRENCY_SGD, // PayNow requires SGD
          paymentMethodTypes: ['paynow'],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('[PaymentScreen] Backend error:', response.status, errorText);
        showToast(`Backend error: ${response.status}. Check backend logs.`);
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.error || !data.clientSecret) {
        showToast(data.error || 'Failed to initialize PayNow');
        setLoading(false);
        return;
      }

      // Step 2: Confirm PayNow payment
      const { paymentIntent, error: confirmError } = await confirmPayment(data.clientSecret, {
        paymentMethodType: 'PayNow',
      });

      if (confirmError) {
        showToast(confirmError.message);
        setLoading(false);
        return;
      }

      // PayNow requires user to scan QR code, so status might be 'requires_action'
      if (paymentIntent && (paymentIntent.status === 'Succeeded' || paymentIntent.status === 'processing')) {
        showToast('Payment initiated! Redirecting...', 1500);
        setTimeout(() => {
          navigation.replace('SignUp', { paid: true, paymentId: paymentIntent.id });
        }, 1500);
      } else if (paymentIntent && paymentIntent.status === 'requires_action') {
        showToast('Please complete payment via PayNow QR code');
        // The Stripe SDK should handle showing the QR code
      }
    } catch (error) {
      console.log('[PaymentScreen] PayNow error:', error);
      if (error.message === 'Network request failed') {
        showToast('Backend not available. Payment endpoint not implemented yet.');
      } else {
        showToast('An error occurred with PayNow');
      }
    }

    setLoading(false);
  };

  const handlePayment = () => {
    if (paymentMethod === 'card') {
      handleCardPayment();
    } else if (paymentMethod === 'paynow') {
      handlePayNowPayment();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Payment</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Toast */}
      {toast ? (
        <View style={[styles.toast, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
          <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>{toast}</Text>
        </View>
      ) : null}

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Payment Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textDim }]}>GoClimb Membership</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>S$0.60</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.accent }]}>S$0.60</Text>
          </View>
        </View>

        {/* Payment Method Selector */}
        <View style={styles.methodSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>
          <View style={styles.methodButtons}>
            <TouchableOpacity
              style={[
                styles.methodButton,
                {
                  backgroundColor: paymentMethod === 'card' ? colors.accent : colors.surface,
                  borderColor: paymentMethod === 'card' ? colors.accent : colors.divider,
                }
              ]}
              onPress={() => setPaymentMethod('card')}
              activeOpacity={0.7}
            >
              <Ionicons name="card" size={18} color={paymentMethod === 'card' ? '#FFFFFF' : colors.text} />
              <Text style={[styles.methodButtonText, { color: paymentMethod === 'card' ? '#FFFFFF' : colors.text }]}>
                Card
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodButton,
                {
                  backgroundColor: paymentMethod === 'paynow' ? colors.accent : colors.surface,
                  borderColor: paymentMethod === 'paynow' ? colors.accent : colors.divider,
                }
              ]}
              onPress={() => setPaymentMethod('paynow')}
              activeOpacity={0.7}
            >
              <Ionicons name="qr-code" size={18} color={paymentMethod === 'paynow' ? '#FFFFFF' : colors.text} />
              <Text style={[styles.methodButtonText, { color: paymentMethod === 'paynow' ? '#FFFFFF' : colors.text }]}>
                PayNow
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card Input - Only show if card is selected */}
        {paymentMethod === 'card' && (
          <View style={styles.cardSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Card Details</Text>
            <View style={[styles.cardFieldContainer, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
              <CardField
                postalCodeEnabled={false}
                placeholders={{
                  number: '4242 4242 4242 4242',
                }}
                cardStyle={{
                  backgroundColor: colors.surface,
                  textColor: colors.text,
                  placeholderColor: colors.textDim,
                }}
                style={styles.cardField}
                onCardChange={(cardDetails) => {
                  setCardComplete(cardDetails.complete);
                }}
              />
            </View>
            <Text style={[styles.secureNote, { color: colors.textDim }]}>
              <Ionicons name="lock-closed" size={12} color={colors.textDim} /> Secure payment powered by Stripe
            </Text>
          </View>
        )}

        {/* PayNow Info - Only show if PayNow is selected */}
        {paymentMethod === 'paynow' && (
          <View style={[styles.payNowInfo, { backgroundColor: colors.surface, borderColor: colors.divider }]}>
            <Ionicons name="qr-code-outline" size={36} color={colors.accent} />
            <Text style={[styles.payNowTitle, { color: colors.text }]}>PayNow QR Payment</Text>
            <Text style={[styles.payNowText, { color: colors.textDim }]}>
              Scan QR code with your banking app
            </Text>
          </View>
        )}

        {/* Pay Button */}
        <TouchableOpacity
          style={[
            styles.payButton,
            { 
              backgroundColor: (paymentMethod === 'card' ? cardComplete : true) && !loading ? colors.accent : colors.surfaceAlt 
            }
          ]}
          onPress={handlePayment}
          disabled={(paymentMethod === 'card' && !cardComplete) || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons 
                name={paymentMethod === 'card' ? 'card' : 'qr-code'} 
                size={20} 
                color="#FFFFFF" 
              />
              <Text style={styles.payButtonText}>Pay S$0.60</Text>
            </>
          )}
        </TouchableOpacity>


      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  toast: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  cardSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  cardFieldContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 8,
  },
  cardField: {
    width: '100%',
    height: 50,
  },
  secureNote: {
    fontSize: 12,
    textAlign: 'center',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  methodSection: {
    marginBottom: 24,
  },
  methodButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  methodButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  payNowInfo: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  payNowTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  payNowText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
