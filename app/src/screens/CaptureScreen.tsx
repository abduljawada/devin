import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadeIn } from '../components/FadeIn';
import { Tap } from '../components/Tap';
import { useSettings } from '../settings';
import { colors, radius } from '../theme';

type Props = {
  onCaptured: (uri: string) => void;
  onCancel: () => void;
};

export const CaptureScreen = ({ onCaptured, onCancel }: Props) => {
  const { t } = useSettings();
  const [permission, requestPermission] = useCameraPermissions();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const flash = useRef(new Animated.Value(0)).current;
  const guide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(guide, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(guide, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [guide]);

  const downscale = async (uri: string): Promise<string> => {
    try {
      const rendered = await ImageManipulator.manipulate(uri).resize({ width: 1024 }).renderAsync();
      const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.7 });
      return saved.uri;
    } catch {
      return uri;
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      onCaptured(await downscale(result.assets[0].uri));
    }
  };

  const shoot = async () => {
    if (!cameraRef.current || busy) {
      return;
    }
    setBusy(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.sequence([
      Animated.timing(flash, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) {
        onCaptured(await downscale(photo.uri));
      }
    } finally {
      setBusy(false);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <FadeIn style={[styles.container, styles.permission]}>
        <Ionicons name="camera-outline" size={40} color={colors.accent} />
        <Text style={styles.permissionText}>{t('cameraPermission')}</Text>
        <Tap style={styles.primary} onPress={requestPermission}>
          <Text style={styles.primaryText}>{t('grant')}</Text>
        </Tap>
        <Tap style={styles.secondary} onPress={pickFromGallery}>
          <Text style={styles.secondaryText}>{t('fromGallery')}</Text>
        </Tap>
        <Tap onPress={onCancel} haptic={null}>
          <Text style={styles.cancel}>{t('cancel')}</Text>
        </Tap>
      </FadeIn>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      <Animated.View
        style={[styles.frame, { opacity: guide.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] }) }]}
        pointerEvents="none"
      >
        <View style={[styles.corner, styles.cornerTl]} />
        <View style={[styles.corner, styles.cornerTr]} />
        <View style={[styles.corner, styles.cornerBl]} />
        <View style={[styles.corner, styles.cornerBr]} />
      </Animated.View>
      <View style={[styles.scanHint, { top: 24 + insets.top }]} pointerEvents="none">
        <View style={styles.hintPill}>
          <Ionicons name="scan-outline" size={15} color="#FFFFFF" />
          <Text style={styles.hintText}>{t('captureHint')}</Text>
        </View>
      </View>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.65)']}
        style={styles.scrim}
        pointerEvents="none"
      />
      <View style={[styles.controls, { bottom: 24 + insets.bottom }]}>
        <Tap onPress={pickFromGallery} style={styles.sideButton} hitSlop={10}>
          <Ionicons name="images-outline" size={22} color="#FFFFFF" />
          <Text style={styles.sideAction}>{t('fromGallery')}</Text>
        </Tap>
        <Tap onPress={shoot} haptic={null} disabled={busy} scaleTo={0.9} style={styles.shutterRing}>
          <View style={[styles.shutter, busy && styles.shutterBusy]}>
            {busy ? <ActivityIndicator color={colors.accent} /> : null}
          </View>
        </Tap>
        <Tap onPress={onCancel} style={styles.sideButton} hitSlop={10}>
          <Ionicons name="close" size={22} color="#FFFFFF" />
          <Text style={styles.sideAction}>{t('cancel')}</Text>
        </Tap>
      </View>
      <Animated.View style={[styles.flash, { opacity: flash }]} pointerEvents="none" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  shutterRing: {
    padding: 5,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterBusy: { opacity: 0.6 },
  flash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 180 },
  frame: {
    position: 'absolute',
    top: '22%',
    bottom: '28%',
    left: '10%',
    right: '10%',
  },
  corner: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderColor: '#FFFFFF',
  },
  cornerTl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 14 },
  cornerTr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 14 },
  cornerBl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 14 },
  cornerBr: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 14,
  },
  scanHint: { position: 'absolute', left: 24, right: 24, alignItems: 'center' },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  hintText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  sideButton: { alignItems: 'center', gap: 4 },
  sideAction: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  permission: { alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  permissionText: { color: colors.text, fontSize: 16, textAlign: 'center' },
  primary: { backgroundColor: colors.accent, paddingHorizontal: 22, paddingVertical: 12, borderRadius: radius.pill },
  primaryText: { color: '#06240F', fontWeight: '700' },
  secondary: {
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  secondaryText: { color: colors.text },
  cancel: { color: colors.textDim, marginTop: 4 },
});
