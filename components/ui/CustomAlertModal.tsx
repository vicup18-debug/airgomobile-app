import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
  type?: 'info' | 'warning' | 'error' | 'success';
  onClose?: () => void;
}

const { width } = Dimensions.get('window');

export default function CustomAlertModal({
  visible,
  title,
  message,
  buttons = [],
  type = 'info',
  onClose,
}: CustomAlertModalProps) {
  const scaleValue = React.useRef(new Animated.Value(0)).current;
  const opacityValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'warning': return { name: 'warning', color: '#DD6B20', bg: 'rgba(221, 107, 32, 0.1)' };
      case 'error': return { name: 'alert-circle', color: '#E53E3E', bg: 'rgba(229, 62, 62, 0.1)' };
      case 'success': return { name: 'checkmark-circle', color: '#38A169', bg: 'rgba(56, 161, 105, 0.1)' };
      case 'info':
      default: return { name: 'information-circle', color: '#000080', bg: 'rgba(0, 0, 128, 0.1)' };
    }
  };

  const iconData = getIcon();

  const handleButtonPress = (btn: AlertButton) => {
    if (btn.onPress) {
      btn.onPress();
    } else if (onClose) {
      onClose();
    }
  };

  const defaultButtons: AlertButton[] = [
    { text: 'OK', onPress: onClose }
  ];

  const activeButtons = buttons.length > 0 ? buttons : defaultButtons;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: opacityValue }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
        
        <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleValue }] }]}>
          <View style={[styles.iconBox, { backgroundColor: iconData.bg }]}>
            <Ionicons name={iconData.name as any} size={32} color={iconData.color} />
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={[styles.buttonContainer, activeButtons.length === 1 && { justifyContent: 'center' }]}>
            {activeButtons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleButtonPress(btn)}
                  style={[
                    styles.button,
                    isCancel && styles.cancelButton,
                    isDestructive && styles.destructiveButton,
                    !isCancel && !isDestructive && styles.primaryButton,
                    activeButtons.length > 1 ? { flex: 1, marginHorizontal: 6 } : { minWidth: '100%' }
                  ]}
                >
                  <Text style={[
                    styles.buttonText,
                    isCancel && styles.cancelButtonText,
                    isDestructive && styles.destructiveButtonText,
                    !isCancel && !isDestructive && styles.primaryButtonText
                  ]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  primaryButton: {
    backgroundColor: '#000080',
    shadowColor: '#000080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#EDF2F7',
  },
  cancelButtonText: {
    color: '#4A5568',
    fontSize: 16,
    fontWeight: 'bold',
  },
  destructiveButton: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FEB2B2',
  },
  destructiveButtonText: {
    color: '#E53E3E',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
