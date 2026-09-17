import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSettings } from '../settings';
import { colors, radius } from '../theme';

type Props = {
  onCaptured: (uri: string) => void;
  onCancel: () => void;
};

export const CaptureScreen = ({ onCaptured, onCancel }: Props) => {
  const { t } = useSettings();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      onCaptured(result.assets[0].uri);
    }
  };

  const shoot = async () => {
    if (!cameraRef.current || busy) {
      return;
    }
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) {
        onCaptured(photo.uri);
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
      <View style={[styles.container, styles.permission]}>
        <Text style={styles.permissionText}>{t('cameraPermission')}</Text>
        <Pressable style={styles.primary} onPress={requestPermission}>
          <Text style={styles.primaryText}>{t('grant')}</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={pickFromGallery}>
          <Text style={styles.secondaryText}>{t('fromGallery')}</Text>
        </Pressable>
        <Pressable onPress={onCancel}>
          <Text style={styles.cancel}>{t('cancel')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      <View style={styles.controls}>
        <Pressable onPress={pickFromGallery} hitSlop={10}>
          <Text style={styles.sideAction}>{t('fromGallery')}</Text>
        </Pressable>
        <Pressable onPress={shoot} style={[styles.shutter, busy && styles.shutterBusy]} />
        <Pressable onPress={onCancel} hitSlop={10}>
          <Text style={styles.sideAction}>{t('cancel')}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  controls: {
    position: 'absolute',
    bottom: 42,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#FFFFFF',
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  shutterBusy: { opacity: 0.5 },
  sideAction: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
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
