import { Document, Page, StyleSheet, Text, View, Image } from '@react-pdf/renderer';
import QRCode from 'qrcode';

const styles = StyleSheet.create({
  page: {
    justifyContent: 'center',
    textAlign: 'center',
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paragraph: {
    fontSize: 12,
  },
  muted: {
    fontSize: 10,
    color: 'gray',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  qrCode: {
    width: 180,
    height: 180,
  },
  keySection: {
    alignItems: 'center',
    marginBottom: 20,
  },
});

// Pre-generate QR codes synchronously before rendering the document
const generateQRCodeSync = (value: string | null | undefined): string => {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return '';
  }
  
  try {
    // Using canvas for synchronous generation
    const canvas = document.createElement('canvas');
    QRCode.toCanvas(canvas, value, { 
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300 
    });
    
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error("QR code generation error:", err);
    return '';
  }
};

export const CredentialsDocument = ({ npub, nsec }: { npub?: string | null; nsec?: string | null }) => {
  // Pre-generate QR codes immediately for PDF rendering
  const npubQR = npub ? generateQRCodeSync(npub) : '';
  const nsecQR = nsec ? generateQRCodeSync(nsec) : '';
  
  // Dynamic message based on available credentials
  const getSecurityMessage = () => {
    const hasBoth = npub && nsec;
    const hasAny = npub || nsec;
    
    if (hasBoth) {
      return "Please keep these credentials somewhere safe. We recommend keeping one print-out stored in a secure place.";
    } else if (hasAny) {
      return "Please keep this credential somewhere safe. We recommend keeping one print-out stored in a secure place.";
    }
    
    return "";
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>Nostr Platform Credentials</Text>
        </View>
        
        {nsec && (
          <View style={styles.keySection}>
            <Text style={styles.heading}>Secret Key:</Text>
            <Text style={styles.paragraph}>{nsec}</Text>
            {nsecQR ? (
              <View style={styles.qrCodeContainer}>
                <Image style={styles.qrCode} src={nsecQR} />
              </View>
            ) : (
              <View style={styles.qrCodeContainer}>
                <Text style={styles.paragraph}>QR code could not be generated</Text>
              </View>
            )}
          </View>
        )}
        
        {npub && (
          <View style={styles.keySection}>
            <Text style={styles.heading}>Public Key:</Text>
            <Text style={styles.paragraph}>{npub}</Text>
            {npubQR ? (
              <View style={styles.qrCodeContainer}>
                <Image style={styles.qrCode} src={npubQR} />
              </View>
            ) : (
              <View style={styles.qrCodeContainer}>
                <Text style={styles.paragraph}>QR code could not be generated</Text>
              </View>
            )}
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.muted}>
            {getSecurityMessage()}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
