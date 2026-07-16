import { useState, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { router } from 'expo-router'
import { processInvoiceImage } from '../../services/ocr'

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [capturedUri, setCapturedUri] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const cameraRef = useRef<CameraView>(null)

  if (!permission) {
    return <View />
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Permiso de cámara requerido</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Conceder permiso</Text>
        </TouchableOpacity>
      </View>
    )
  }

  async function takePicture() {
    const photo = await cameraRef.current?.takePictureAsync()
    if (!photo?.uri) return

    setCapturedUri(photo.uri)
    setProcessing(true)

    try {
      const ocrResult = await processInvoiceImage(photo.uri)
      router.push({
        pathname: '/invoice/review',
        params: { data: JSON.stringify(ocrResult), imageUri: photo.uri },
      })
    } catch (err) {
      Alert.alert('Error de OCR', 'No se pudo procesar la imagen. Intenta de nuevo.')
      setCapturedUri(null)
    } finally {
      setProcessing(false)
    }
  }

  if (capturedUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedUri }} style={styles.preview} />
        <Text style={styles.processingText}>
          {processing ? 'Procesando factura...' : 'Procesado'}
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.hint}>Centra la factura en el recuadro</Text>
        </View>
      </CameraView>
      <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
        <View style={styles.captureInner} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanFrame: {
    width: 280,
    height: 400,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  hint: { color: '#FFFFFF', fontSize: 14, marginTop: 24, opacity: 0.8 },
  captureButton: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  preview: { flex: 1, resizeMode: 'contain' },
  processingText: { color: '#FFFFFF', fontSize: 18, textAlign: 'center', padding: 20 },
  title: { color: '#FFFFFF', fontSize: 18, textAlign: 'center', marginBottom: 20 },
  button: { backgroundColor: '#2563EB', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
})
