import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

const screenWidth = Dimensions.get('window').width;

interface AlertAction {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  actions: AlertAction[];
  onClose?: () => void;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  actions,
  onClose,
}) => {
  const { isDarkMode } = useTheme();

  const handleActionPress = (action: AlertAction) => {
    if (action.onPress) {
      action.onPress();
    }
    if (onClose) {
      onClose();
    }
  };

  const getButtonStyle = (style?: string) => {
    switch (style) {
      case 'destructive':
        return {
          backgroundColor: '#FF6B6B',
          color: '#ffffff',
        };
      case 'cancel':
        return {
          backgroundColor: isDarkMode ? '#2a2a2a' : '#E5E5E5',
          color: isDarkMode ? '#ffffff' : '#000000',
        };
      default:
        return {
          backgroundColor: '#FF6B35',
          color: '#ffffff',
        };
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.alertContainer,
          { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }
        ]}>
          {/* Alert Icon */}
          <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#2a2a2a' : '#F8F9FA' }]}>
            <IconSymbol 
              name="exclamationmark.triangle.fill" 
              size={24} 
              color="#FF6B35" 
            />
          </View>

          {/* Title */}
          <Text style={[
            styles.title,
            { color: isDarkMode ? '#ffffff' : '#000000' }
          ]}>
            {title}
          </Text>

          {/* Message */}
          <Text style={[
            styles.message,
            { color: isDarkMode ? '#cccccc' : '#666666' }
          ]}>
            {message}
          </Text>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {actions.map((action, index) => {
              const buttonStyles = getButtonStyle(action.style);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.actionButton,
                    { backgroundColor: buttonStyles.backgroundColor },
                    actions.length === 1 && styles.singleActionButton,
                  ]}
                  onPress={() => handleActionPress(action)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.actionText,
                    { color: buttonStyles.color },
                    action.style === 'destructive' && styles.destructiveText,
                  ]}>
                    {action.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  actionButton: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  singleActionButton: {
    marginTop: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  destructiveText: {
    fontWeight: 'bold',
  },
});