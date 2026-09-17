import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSettings } from '../settings';
import { colors, radius } from '../theme';

type Props = {
  onCaptured: (uri: string) => void;
  onScanned: (barcode: string) => void;
  onCancel: () => void;
};

export const CaptureScreen = ({ onCaptured, onScanned, onCancel }: Props) => {
  const { t } = useSettings();
  const [permission, requestPermission] = useCameraPermissions();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scanned = useRef(false);
  const cameraRef = useRef<CameraView>(null);

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
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) {
        onCaptured(await downscale(photo.uri));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleBarcode = ({ data }: BarcodeScanningResult) => {
    if (scanned.current || !data) {
      return;
    }
    scanned.current = true;
    onScanned(data);
  };

  const toggleScanning = () => {
    scanned.current = false;
    setScanning((current) => !current);
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
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
        }}
        onBarcodeScanned={scanning ? handleBarcode : undefined}
      />
      {scanning ? (
        <View style={[styles.scanHint, { top: 24 + insets.top }]} pointerEvents="none">
          <View style={styles.frame} />
          <Text style={styles.hintText}>{t('scanHint')}</Text>
        </View>
      ) : null}
      <View style={[styles.controls, { bottom: 24 + insets.bottom }]}>
        <Pressable onPress={pickFromGallery} hitSlop={10}>
          <Text style={styles.sideAction}>{t('fromGallery')}</Text>
        </Pressable>
        <Pressable
          onPress={scanning ? toggleScanning : shoot}
          style={[styles.shutter, busy && styles.shutterBusy, scanning && styles.shutterScanning]}
        />
        <Pressable onPress={toggleScanning} hitSlop={10}>
          <Text style={styles.sideAction}>{t(scanning ? 'photoMode' : 'scanBarcode')}</Text>
        </Pressable>
      </View>
      <Pressable onPress={onCancel} hitSlop={10} style={[styles.close, { top: 20 + insets.top }]}>
        <Text style={styles.sideAction}>{t('cancel')}</Text>
      </Pressable>
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
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#FFFFFF',
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  shutterBusy: { opacity: 0.5 },
  shutterScanning: { backgroundColor: colors.accent, borderColor: 'rgba(56,224,120,0.35)' },
  close: { position: 'absolute', right: 20 },
  scanHint: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 12 },
  frame: {
    width: 260,
    height: 150,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: radius.md,
  },
  hintText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', textAlign: 'center' },
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
