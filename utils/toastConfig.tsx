import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseToastProps } from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

interface CustomToastProps extends BaseToastProps {
    text1?: string;
    text2?: string;
}

export const toastConfig = {
    // 🟢 PREMIUM SUCCESS BANNER
    success: ({ text1, text2, ...rest }: CustomToastProps) => (
        <View style={[styles.bannerContainer, styles.successBanner]}>
            <View style={[styles.iconContainer, styles.successIcon]}>
                <Ionicons name="checkmark-circle" size={24} color="#FFF" />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.titleText}>{text1}</Text>
                {text2 ? <Text style={styles.messageText}>{text2}</Text> : null}
            </View>
        </View>
    ),

    // 🔴 ERROR BANNER
    error: ({ text1, text2, ...rest }: CustomToastProps) => (
        <View style={[styles.bannerContainer, styles.errorBanner]}>
            <View style={[styles.iconContainer, styles.errorIcon]}>
                <Ionicons name="alert-circle" size={24} color="#FFF" />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.titleText}>{text1}</Text>
                {text2 ? <Text style={styles.messageText}>{text2}</Text> : null}
            </View>
        </View>
    ),

    // 🔵 INFO BANNER
    info: ({ text1, text2, ...rest }: CustomToastProps) => (
        <View style={[styles.bannerContainer, styles.infoBanner]}>
            <View style={[styles.iconContainer, styles.infoIcon]}>
                <Ionicons name="information-circle" size={24} color="#000080" />
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.titleText, { color: '#000080' }]}>{text1}</Text>
                {text2 ? <Text style={[styles.messageText, { color: '#4A5568' }]}>{text2}</Text> : null}
            </View>
        </View>
    ),
};

const styles = StyleSheet.create({
    bannerContainer: {
        width: '90%',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
        marginTop: 10,
    },
    successBanner: {
        backgroundColor: '#000080', // Navy Blue
        borderLeftWidth: 6,
        borderLeftColor: '#FFB81C', // Gold Accent
    },
    errorBanner: {
        backgroundColor: '#E53E3E', // Red
        borderLeftWidth: 6,
        borderLeftColor: '#FFF',
    },
    infoBanner: {
        backgroundColor: '#FFFFFF', // White
        borderLeftWidth: 6,
        borderLeftColor: '#000080',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    successIcon: {
        backgroundColor: 'rgba(255,184,28,0.2)',
    },
    errorIcon: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    infoIcon: {
        backgroundColor: 'rgba(0,0,128,0.1)',
    },
    textContainer: {
        flex: 1,
    },
    titleText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    messageText: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 20,
    },
});
